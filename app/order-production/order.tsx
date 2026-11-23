import Button from "@/components/button";
import ProdutoLoteModal from "@/components/ProdutoLoteModal";
import {getUser} from "@/services/auth";
import {getOrderById, updateOrderStatus, OrderStatus} from "@/services/OrderProduction";
import {
  createProductionWithItems, getProductionItems, ProductionItem, ProductionItemPayload,
  createProductionItems, updateProductionItem, removeProductionItem
} from "@/services/ProductionReports";
import {Lote,Produto} from "@/services/StockApi";
import {useLocalSearchParams,useRouter} from "expo-router";
import {useEffect,useState} from "react";
import {Alert,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";

type EditedItem = ProductionItemPayload & { id?:string };
const validIso = (text:string) => /^\d{4}-\d{2}-\d{2}$/.test(text);
function toIso(text:string):string {
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [d,m,y]=text.split("/");
    return `${y}-${m}-${d}`;
  }
  return text.slice(0,10);
}
function generatedLot() {
  const date=new Date();
  return `${String(date.getDate()).padStart(2,"0")}${String(date.getMonth()+1).padStart(2,"0")}${String(date.getFullYear()).slice(-2)}BRI`;
}
export default function OrderScreen() {
  const router=useRouter();
  const {orderId}=useLocalSearchParams<{orderId?:string}>();
  const [items,setItems]=useState<EditedItem[]>([]);
  const [deleted,setDeleted]=useState<string[]>([]);
  const [status,setStatus]=useState<OrderStatus>(OrderStatus.PENDING);
  const [modal,setModal]=useState<"Input"|"Output"|null>(null);
  const [editing,setEditing]=useState<number|null>(null);
  const [qty,setQty]=useState("1");
  const [weight,setWeight]=useState("1");
  const [saving,setSaving]=useState(false);
  const [loading,setLoading]=useState(!!orderId);

  useEffect(()=>{
    if(!orderId)return;
    let active=true;
    Promise.all([getProductionItems(orderId),getOrderById(orderId)])
      .then(([it,order])=>{
        if(!active)return;
        setItems(it.map(({id,orderId:_,...item})=>({...item,id})));
        setStatus(order.productionStatus);
      })
      .catch(()=>{if(active)Alert.alert("Erro","Não foi possível carregar a ordem.");})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[orderId]);

  function addProduct(product:Produto,lot:Lote,fab:string,val:string) {
    const quantity=Number(qty.replace(",","."));
    const unitWeight=Number(weight.replace(",","."));
    const fabrication=toIso(fab), validity=toIso(val);
    if(!Number.isFinite(quantity)||quantity<=0||!Number.isFinite(unitWeight)||unitWeight<=0||
       !validIso(fabrication)||!validIso(validity)) {
      Alert.alert("Dados inválidos","Informe quantidade e peso positivos e datas válidas.");return;
    }
    const existing=editing===null?undefined:items[editing];
    const next:EditedItem={
      id:existing?.id,itemType:modal??"Input",externalProductId:String(product.id),
      productName:product.descricao,unit:product.unidadeMedida||"KG",
      quantity,unitWeight,lot:lot.identificacao,
      externalLotId:lot.id||null,dateFabrication:fabrication,dateValidity:validity
    };
    setItems(prev=>editing===null?[...prev,next]:prev.map((v,i)=>i===editing?next:v));
    setModal(null);setEditing(null);setQty("1");setWeight("1");
  }
  function editItem(i:number) {
    setEditing(i);setQty(String(items[i].quantity));setWeight(String(items[i].unitWeight));
    setModal(items[i].itemType);
  }
  function deleteItem(i:number) {
    const target=items[i];
    if(target.id)setDeleted(prev=>[...prev,target.id!]);
    setItems(prev=>prev.filter((_,index)=>i!==index));
  }
  async function save() {
    if(saving||loading||items.length===0) {
      if(items.length===0)Alert.alert("Adicione um produto","É necessário informar ao menos um item.");
      return;
    }
    setSaving(true);
    try{
      const user=await getUser();
      if(!user?.id) throw new Error("Usuário não autenticado.");
      let id=orderId;
      if (!id) {
        const created=await createProductionWithItems(user.id,status,items.map(({id:_,...item})=>item));
        id=created.id;
      } else {
        await updateOrderStatus(id,{userId:user.id,productionStatus:status});
        for(const item of items) {
          if(item.id) await updateProductionItem({...item,id:item.id,orderId:id});
          else await createProductionItems([{...item,orderId:id}]);
        }
        for(const itemId of deleted) await removeProductionItem(itemId);
      }
      router.replace({pathname:"/order-production/reports",params:{orderId:id}});
    }catch(error) {
      Alert.alert("Erro ao salvar",error instanceof Error?error.message:"Verifique sua conexão e tente novamente.");
    }finally{setSaving(false);}
  }
  const renderGroup=(type:"Input"|"Output",label:string)=> <View style={styles.section}>
    <Text style={styles.label}>{label}</Text>
    {items.map((item,i)=>item.itemType!==type?null:<View key={item.id??i} style={styles.item}>
      <TouchableOpacity style={{flex:1}} onPress={()=>editItem(i)}>
        <Text style={styles.itemName}>{item.productName}</Text>
        <Text style={styles.muted}>Código {item.externalProductId} · {item.quantity} {item.unit} · Peso {item.unitWeight}</Text>
        <Text style={styles.muted}>Lote {item.lot} · Fab {item.dateFabrication} · Val {item.dateValidity}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={()=>deleteItem(i)}><Text style={styles.delete}>Excluir</Text></TouchableOpacity>
    </View>)}
    <TouchableOpacity style={styles.outline} onPress={()=>{setEditing(null);setQty("1");setWeight("1");setModal(type);}}>
      <Text style={styles.add}>+ Adicionar {type==="Input"?"insumo":"produto final"}</Text>
    </TouchableOpacity>
  </View>;
  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={()=>router.back()}><Text style={styles.add}>‹ Voltar</Text></TouchableOpacity>
      <Text style={styles.title}>{orderId?"Editar Ordem":"Nova Ordem de Produção"}</Text>
      <Text style={styles.muted}>{orderId?`ID: ${orderId}`:"A numeração será gerada automaticamente."}</Text>
      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {Object.values(OrderStatus).map(option=><TouchableOpacity key={option}
          style={[styles.status,status===option&&styles.statusSelected]} onPress={()=>setStatus(option)}>
          <Text style={styles.statusText}>{option==="IN_PROGRESS"?"EM PRODUÇÃO":option==="PENDING"?"PENDENTE":option==="COMPLETED"?"CONCLUÍDA":"CANCELADA"}</Text>
        </TouchableOpacity>)}
      </View>
      {loading?<Text style={styles.muted}>Carregando itens...</Text>:<>
        {renderGroup("Input","Insumos")}
        {renderGroup("Output","Produtos finais")}
        <TouchableOpacity disabled={saving} style={styles.button} onPress={save}>
          <Text style={styles.buttonText}>{saving?"Salvando...":"Salvar e preencher documentos"}</Text>
        </TouchableOpacity>
        {!!orderId&&<TouchableOpacity style={styles.outline} onPress={()=>router.push({pathname:"/order-production/reports",params:{orderId}})}>
          <Text style={styles.add}>Abrir documentos e PDFs</Text>
        </TouchableOpacity>}
      </>}
    </ScrollView>
    <ProdutoLoteModal visible={modal!==null} title={editing===null?"Adicionar produto":"Editar produto"}
      autoLote={modal==="Output"?generatedLot():undefined} manualDates={modal==="Output"}
      onClose={()=>{setModal(null);setEditing(null);}}
      onConfirm={addProduct}/>
    {modal!==null&&<View style={styles.quantityOverlay} pointerEvents="box-none">
      <View style={styles.quantityBox}>
        <Text style={styles.label}>Quantidade e peso unitário</Text>
        <View style={styles.qtyRow}>
          <TextInput style={styles.qtyInput} keyboardType="decimal-pad" value={qty}
            onChangeText={setQty} placeholder="Quantidade" placeholderTextColor="#aaa"/>
          <TextInput style={styles.qtyInput} keyboardType="decimal-pad" value={weight}
            onChangeText={setWeight} placeholder="Peso unitário" placeholderTextColor="#aaa"/>
        </View>
        <Text style={styles.muted}>Esses valores serão aplicados ao produto selecionado.</Text>
      </View>
    </View>}
  </SafeAreaView>;
}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:"#0a0a1a"},
  content:{padding:20,gap:15,paddingBottom:64},
  title:{color:"#d9ecff",fontSize:24,fontWeight:"800"},
  muted:{color:"#8bb4da",fontSize:12,marginTop:3},
  label:{color:"#a8d8ff",fontWeight:"700",fontSize:15},
  section:{gap:9,marginTop:14},
  statusRow:{flexDirection:"row",flexWrap:"wrap",gap:7},
  status:{padding:9,backgroundColor:"#223052",borderRadius:7},
  statusSelected:{backgroundColor:"#386ebd"},
  statusText:{fontSize:10,color:"#fff",fontWeight:"700"},
  item:{padding:12,backgroundColor:"#17264a",borderRadius:9,flexDirection:"row",alignItems:"center",gap:8},
  itemName:{color:"#fff",fontWeight:"700",fontSize:13},
  delete:{color:"#ff9292",fontWeight:"700",fontSize:12},
  outline:{borderColor:"#467cb5",borderWidth:1,padding:13,alignItems:"center",borderRadius:9},
  add:{color:"#9edaff",fontWeight:"700",fontSize:14},
  button:{backgroundColor:"#386ebd",padding:15,alignItems:"center",borderRadius:9},
  buttonText:{color:"#fff",fontWeight:"700"},
  quantityOverlay:{position:"absolute",bottom:0,left:0,right:0,pointerEvents:"box-none"},
  quantityBox:{backgroundColor:"#101c3a",padding:10,borderTopColor:"#467cb5",borderTopWidth:1},
  qtyRow:{flexDirection:"row",gap:10},
  qtyInput:{flex:1,backgroundColor:"#23375f",borderRadius:8,padding:9,color:"#fff"},
});
