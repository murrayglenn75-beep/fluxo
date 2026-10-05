'use client';
import {Capacitor} from '@capacitor/core';
export async function exportText(filename:string,text:string,type='text/plain'){
 if(Capacitor.isNativePlatform()){
  const {Filesystem,Directory,Encoding}=await import('@capacitor/filesystem');const {Share}=await import('@capacitor/share');
  const file=await Filesystem.writeFile({path:filename.replace(/[^a-zA-Z0-9_.-]/g,'_'),data:text,directory:Directory.Cache,encoding:Encoding.UTF8});
  await Share.share({title:filename,files:[file.uri],dialogTitle:'Export from Fluxo'});return;
 }
 const url=URL.createObjectURL(new Blob([text],{type}));const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function shareText(title:string,text:string){if(Capacitor.isNativePlatform()){const {Share}=await import('@capacitor/share');await Share.share({title,text});}else if(navigator.share){await navigator.share({title,text});}else{await navigator.clipboard.writeText(text);}}
