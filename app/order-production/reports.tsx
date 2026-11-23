import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ProductionDetails, ProductionItem, QualityCheck, QualityPayload,
  downloadProductionPdf, getProductionDetails, getProductionItems, getQualityChecks,
  saveProductionDetails, saveQualityCheck
} from "@/services/ProductionReports";

const EMPTY_DETAILS: ProductionDetails = {
  requisitionNumber:"", description:"", startedOn:null, completedOn:null, responsible:""
};
const EMPTY_QUALITY: QualityPayload = {
  aspectApproved:null,colorApproved:null,odorApproved:null,samplesCollected:null,
  labelsVerified:null,responsible:"",correctiveAction:""
};
const fields: Array<{key:keyof QualityPayload; label:string}> = [
  {key:"aspectApproved",label:"Aspecto aprovado"},
  {key:"colorApproved",label:"Cor aprovada"},
  {key:"odorApproved",label:"Odor aprovado"},
  {key:"samplesCollected",label:"Coletou amostras?"},
  {key:"labelsVerified",label:"Verificação de etiquetas"},
];
const validDate = (date:string|null) => !date || /^\d{4}-\d{2}-\d{2}$/.test(date);
function errorMessage(error:unknown) {return error instanceof Error?error.message:"Não foi possível concluir a operação.";}
function TextField({label,value,onChange,placeholder,multiline=false}:{
  label:string;value:string;onChange:(value:string)=>void;placeholder?:string;multiline?:boolean
}) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={[styles.input,multiline && {minHeight:78,textAlignVertical:"top"}]}
      placeholder={placeholder} placeholderTextColor="#7796b5" value={value}
      onChangeText={onChange} multiline={multiline} autoCapitalize="sentences"/>
  </View>;
}
function Choose({label,value,onChange}:{
  label:string;value:boolean|null;onChange:(value:boolean|null)=>void
}) {
  return <View style={styles.optionRow}>
    <Text style={styles.optionLabel}>{label}</Text>
    <View style={styles.choices}>
      {([{label:"Sim",value:true},{label:"Não",value:false},{label:"—",value:null}] as const).map(option=>
        <TouchableOpacity key={String(option.value)} onPress={()=>onChange(option.value)}
          style={[styles.choice,value===option.value && styles.choiceSelected]}>
          <Text style={styles.choiceText}>{option.label}</Text>
        </TouchableOpacity>)}
    </View>
  </View>;
}
export default function ProductionReportsScreen() {
  const router = useRouter();
  const {orderId} = useLocalSearchParams<{orderId:string}>();
  const [details,setDetails] = useState<ProductionDetails>(EMPTY_DETAILS);
  const [items,setItems] = useState<ProductionItem[]>([]);
  const [quality,setQuality] = useState<Record<string,QualityPayload>>({});
  const [activeTab,setActiveTab] = useState<"order"|"quality">("order");
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);

  useEffect(()=>{
    if (!orderId) {setLoading(false);return;}
    let mounted=true;
    (async()=>{
      try {
        const [d,it,checks] = await Promise.all([
          getProductionDetails(orderId),getProductionItems(orderId),getQualityChecks(orderId)
        ]);
        if (!mounted) return;
        setDetails({...EMPTY_DETAILS,...d});
        setItems(it);
        const lookup:Record<string,QualityPayload>={};
        checks.forEach(({itemId,...rest})=>{lookup[itemId]=rest;});
        setQuality(lookup);
      } catch(e) {if(mounted) Alert.alert("Erro ao carregar relatórios",errorMessage(e));}
      finally {if(mounted)setLoading(false);}
    })();
    return ()=>{mounted=false;};
  },[orderId]);

  async function saveDetails() {
    if (!orderId || busy) return;
    if (!validDate(details.startedOn)||!validDate(details.completedOn)){
      Alert.alert("Datas inválidas","Utilize o formato AAAA-MM-DD.");return;
    }
    setBusy(true);
    try {await saveProductionDetails(orderId,details);Alert.alert("Salvo","Dados da ordem atualizados.");}
    catch(e){Alert.alert("Erro ao salvar",errorMessage(e));}
    finally{setBusy(false);}
  }
  async function saveQuality() {
    if (!orderId || busy) return;
    setBusy(true);
    try {
      for(const item of qualityItems) {
        if(quality[item.id]) await saveQualityCheck(orderId,item.id,quality[item.id]);
      }
      Alert.alert("Salvo","Avaliações de qualidade atualizadas.");
    }catch(e){Alert.alert("Erro ao salvar",errorMessage(e));}
    finally{setBusy(false);}
  }
  async function download(kind:"production"|"quality") {
    if (!orderId || busy) return;
    setBusy(true);
    try {await downloadProductionPdf(orderId,kind);}
    catch(e){Alert.alert("Erro ao baixar",errorMessage(e));}
    finally{setBusy(false);}
  }
  function changeQuality(itemId:string,changes:Partial<QualityPayload>) {
    setQuality(previous=>({
      ...previous,[itemId]:{...EMPTY_QUALITY,...previous[itemId],...changes}
    }));
  }
  const qualityItems=items.filter(item=>item.itemType==="Output");
  const displayedQuality=qualityItems.length?qualityItems:items.filter(item=>item.itemType==="Input");

  return <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={()=>router.back()}><Text style={styles.link}>‹ Voltar para produção</Text></TouchableOpacity>
      <Text style={styles.heading}>Documentos da Produção</Text>
      <Text style={styles.subtitle}>Ordem {details.orderNumber ? "#"+details.orderNumber : orderId}</Text>
      <Text style={styles.note}>Os campos de assinatura permanecem em branco no PDF para preenchimento no papel.</Text>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab,activeTab==="order"&&styles.activeTab]} onPress={()=>setActiveTab("order")}>
          <Text style={styles.tabLabel}>Ordem de Produção</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab,activeTab==="quality"&&styles.activeTab]} onPress={()=>setActiveTab("quality")}>
          <Text style={styles.tabLabel}>Fracionamento</Text>
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator size="large" color="#7ec8ff"/> : activeTab==="order" ? <>
        <Text style={styles.section}>Cabeçalho do documento</Text>
        <TextField label="Requisição" value={details.requisitionNumber??""}
          onChange={value=>setDetails(p=>({...p,requisitionNumber:value}))}/>
        <TextField label="Descritivo" value={details.description??""}
          onChange={value=>setDetails(p=>({...p,description:value}))}/>
        <TextField label="Responsável" value={details.responsible??""}
          onChange={value=>setDetails(p=>({...p,responsible:value}))}/>
        <TextField label="Data de início (AAAA-MM-DD)" placeholder="2026-11-03"
          value={details.startedOn??""} onChange={value=>setDetails(p=>({...p,startedOn:value||null}))}/>
        <TextField label="Data de conclusão (AAAA-MM-DD)" placeholder="Deixar vazio enquanto pendente"
          value={details.completedOn??""} onChange={value=>setDetails(p=>({...p,completedOn:value||null}))}/>
        <Text style={styles.section}>Insumos e produtos finais</Text>
        {items.length===0?<Text style={styles.note}>Esta ordem ainda não possui itens. Adicione-os na tela da ordem antes de gerar o PDF.</Text>:
          items.map(item=><View key={item.id} style={styles.product}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.productInfo}>{item.itemType==="Input"?"INSUMO":"PRODUTO FINAL"} · Código: {item.externalProductId}</Text>
            <Text style={styles.productInfo}>{item.quantity} {item.unit} · Lote: {item.lot}</Text>
            <Text style={styles.productInfo}>Fabricação: {item.dateFabrication} · Validade: {item.dateValidity}</Text>
          </View>)}
        <TouchableOpacity style={styles.button} disabled={busy} onPress={saveDetails}>
          <Text style={styles.buttonText}>{busy?"Salvando...":"Salvar cabeçalho"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} disabled={busy} onPress={()=>download("production")}>
          <Text style={styles.buttonText}>Baixar Ordem de Produção (PDF)</Text>
        </TouchableOpacity>
      </> : <>
        <Text style={styles.section}>Avaliação dos produtos</Text>
        {displayedQuality.length===0?<Text style={styles.note}>Adicione produtos na ordem para registrar a avaliação.</Text>:
        displayedQuality.map(item=>{
          const values={...EMPTY_QUALITY,...quality[item.id]};
          return <View key={item.id} style={styles.product}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.productInfo}>Código: {item.externalProductId} · Lote: {item.lot}</Text>
            {fields.map(field=><Choose key={field.key} label={field.label}
              value={values[field.key] as boolean|null}
              onChange={value=>changeQuality(item.id,{[field.key]:value})}/>)}
            <TextField label="Responsável" value={values.responsible??""}
              onChange={value=>changeQuality(item.id,{responsible:value})}/>
            <TextField label="Ação corretiva / Observação" multiline
              value={values.correctiveAction??""}
              onChange={value=>changeQuality(item.id,{correctiveAction:value})}/>
          </View>;
        })}
        <TouchableOpacity style={styles.button} disabled={busy} onPress={saveQuality}>
          <Text style={styles.buttonText}>{busy?"Salvando...":"Salvar avaliação"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} disabled={busy} onPress={()=>download("quality")}>
          <Text style={styles.buttonText}>Baixar Controle de Fracionamento (PDF)</Text>
        </TouchableOpacity>
      </>}
    </ScrollView>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:"#0a0a1a"},
  content:{padding:20,paddingBottom:64,gap:13},
  link:{color:"#7ec8ff",fontSize:14,marginBottom:8},
  heading:{color:"#d9ecff",fontSize:23,fontWeight:"800"},
  subtitle:{color:"#7ec8ff",fontSize:13},
  note:{color:"#c1d7ee",fontSize:12,lineHeight:18},
  tabs:{flexDirection:"row",gap:8,marginVertical:8},
  tab:{flex:1,padding:12,backgroundColor:"#18254b",borderRadius:9,alignItems:"center"},
  activeTab:{backgroundColor:"#335a9c"},
  tabLabel:{color:"#fff",fontSize:12,fontWeight:"700"},
  section:{color:"#a8d8ff",fontWeight:"700",fontSize:17,marginTop:10},
  field:{gap:5},
  label:{color:"#9ecfff",fontWeight:"600",fontSize:12},
  input:{borderWidth:1,borderColor:"#355b84",color:"#fff",padding:12,borderRadius:10,backgroundColor:"#142142"},
  product:{backgroundColor:"#101c3a",padding:14,borderColor:"#355b84",borderWidth:1,borderRadius:12,gap:8},
  productName:{color:"#fff",fontWeight:"700",fontSize:14},
  productInfo:{color:"#a8c6e8",fontSize:12},
  optionRow:{gap:6,marginTop:4},
  optionLabel:{color:"#d9ecff",fontSize:12},
  choices:{flexDirection:"row",gap:7},
  choice:{paddingHorizontal:17,paddingVertical:8,borderRadius:7,backgroundColor:"#26385e"},
  choiceSelected:{backgroundColor:"#416fbd"},
  choiceText:{color:"#fff",fontSize:12},
  button:{backgroundColor:"#386ebd",borderRadius:10,padding:14,alignItems:"center",marginTop:9},
  secondaryButton:{backgroundColor:"#204675",borderRadius:10,padding:14,alignItems:"center"},
  buttonText:{color:"#fff",fontWeight:"700",fontSize:13},
});
