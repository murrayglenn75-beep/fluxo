import type {MetadataRoute} from 'next';
export const dynamic='force-static';
export default function manifest():MetadataRoute.Manifest{return{name:'Fluxo',short_name:'Fluxo',description:'Your mobile sandbox wallet',start_url:'/',display:'standalone',background_color:'#f7f9fb',theme_color:'#062b28',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png'}]};}
