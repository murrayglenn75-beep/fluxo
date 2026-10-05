import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata: Metadata={title:"Fluxo",description:"Secure AI-native financial control plane"};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body>{children}</body></html>}
