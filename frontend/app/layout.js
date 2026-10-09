import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font" });
const head = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-head",
  weight: ["500", "700"],
});

export const metadata = {
  title: "SkillSetra AI | Know It. Apply It. Prove It.",
  description: "Evidence-based competency intelligence for learners.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${head.variable}`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>

      <body>
        <Script
          src="https://js.puter.com/v2/"
          strategy="afterInteractive"
        />

        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}