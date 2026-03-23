import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-[100dvh] font-sans flex flex-col overflow-hidden">
      
      {/* BACKGROUND IMAGE CONTAINER */}
      <div className="absolute inset-0 z-0 bg-[#EAF3FA]">
        {/*
          IMPORTANT : L'image fournie doit être importée / sauvegardée
          sous le nom 'fond_routipass.png' dans le dossier 'public/images/'.
        */}
        <Image
          src="/images/fond_routipass.png"
          alt="Illustration isométrique RoutiPass"
          fill
          className="object-cover object-[75%_center] md:object-[90%_center] lg:object-right"
          priority
          quality={100}
        />
        {/* Mobile Gradient Overlay (aide à la lisibilité des boutons en bas) */}
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-[#EAF3FA]/80 to-transparent pointer-events-none md:hidden"></div>
      </div>

      {/* OVERLAY CONTENT */}
      <div className="relative z-10 flex flex-col flex-1">
        
        {/* HEADER */}
        <header className="w-full px-6 py-8 md:px-16 md:py-12 flex items-center justify-center md:justify-between shrink-0 drop-shadow-sm">
          <div className="flex items-center">
            <h1 className="text-4xl md:text-[40px] font-black text-[#1E3A8A] tracking-tighter mix-blend-multiply">
              Routipass
            </h1>
          </div>
          
          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-12">
            <Link href="/" className="text-[#1E3A8A] font-bold text-base hover:opacity-70 transition-opacity drop-shadow">Accueil</Link>
            <Link href="/about" className="text-[#1E3A8A] font-bold text-base hover:opacity-70 transition-opacity drop-shadow">A propos</Link>
            <Link href="/help" className="text-[#1E3A8A] font-bold text-base hover:opacity-70 transition-opacity drop-shadow">Aide</Link>
          </nav>
        </header>

        {/* MAIN CONTENT (DESKTOP) & MOBILE BUTTONS */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col px-6 md:px-16">
          
          {/* Desktop Left Area (Buttons in the negative space) */}
          <div className="hidden md:flex flex-col justify-center w-[40%] xl:w-[35%] my-auto pb-[10vh]">
            <div className="flex flex-col xl:flex-row gap-5 w-full">
              <Link 
                href="/login" 
                className="flex-1 flex items-center justify-center py-[18px] px-8 rounded-full border-2 border-[#1E3A8A] bg-white/60 backdrop-blur-md text-[#1E3A8A] font-bold text-lg hover:bg-white hover:shadow-lg transition-all text-center whitespace-nowrap"
              >
                Connexion
              </Link>
              <Link 
                href="/inscription" 
                className="flex-1 flex items-center justify-center py-[18px] px-8 rounded-full bg-[#1E3A8A] text-white font-bold text-lg shadow-[0_8px_25px_rgb(30,58,138,0.25)] hover:bg-[#152865] hover:shadow-[0_12px_30px_rgb(30,58,138,0.4)] hover:-translate-y-0.5 transition-all text-center whitespace-nowrap"
              >
                Inscription
              </Link>
            </div>
          </div>

          {/* Mobile Buttons (At middle) */}
          <div className="md:hidden w-full max-w-sm mx-auto flex flex-col gap-4 shrink-0 my-auto pb-[10vh] drop-shadow-xl">
            <Link 
              href="/login" 
              className="w-full flex items-center justify-center py-[16px] rounded-full border-[2.5px] border-[#1E3A8A] bg-white/70 backdrop-blur-md text-[#1E3A8A] font-bold text-[16px] active:bg-white transition-colors"
            >
              Connexion
            </Link>
            <Link 
              href="/inscription" 
              className="w-full flex items-center justify-center py-[16px] rounded-full bg-[#1E3A8A] text-white font-bold text-[16px] shadow-lg active:bg-[#152865] transition-colors"
            >
              Inscription
            </Link>
          </div>
          
        </main>
      </div>
    </div>
  );
}
