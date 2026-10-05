const fs=require('fs');const sharp=require('sharp');
(async()=>{const svg=fs.readFileSync('public/icon.svg');for(const n of [192,512])await sharp(svg).resize(n,n).png().toFile(`public/icon-${n}.png`);
await sharp(svg).resize(1024,1024).flatten({background:'#062b28'}).png().toFile('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
for(const [density,n] of Object.entries({'mdpi':48,'hdpi':72,'xhdpi':96,'xxhdpi':144,'xxxhdpi':192})){for(const name of ['ic_launcher','ic_launcher_round'])await sharp(svg).resize(n,n).png().toFile(`android/app/src/main/res/mipmap-${density}/${name}.png`);await sharp(svg).resize(Math.round(n*2.25),Math.round(n*2.25)).png().toFile(`android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`);}
for(const xml of ['android/app/src/main/res/values/ic_launcher_background.xml','android/app/src/main/res/drawable/ic_launcher_background.xml']){let text=fs.readFileSync(xml,'utf8').replaceAll('#FFFFFF','#062b28').replaceAll('#ffffff','#062b28');fs.writeFileSync(xml,text);}
})();
