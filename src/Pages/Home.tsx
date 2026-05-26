import { Link } from "react-router-dom";
import OnboardingBackground from "../components/backgrounds/OnboardingBackground";

export default function Home(){
    return(
          <div className="flex flex-col items-center justify-center">
      <OnboardingBackground />
      <div className="relative w-full t-0 p-0 m-0 max-h-screen  z-10 flex flex-col items-center justify-center">
        <img
          src="/logo.svg"
          alt="DawnDesk Logo"
          width={100}
          height={100}
          className="w-[30vw] max-w-[200px] mb-8"
        />
        <div className="px-[20px] flex flex-col items-center justify-center relative sm:bottom-10 xl:bottom-20 ">
          <h1 className="text-3xl sm:text-5xl md:text-7xl xl:text-8xl font-bold text-white mb-4">DawnDesk</h1>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-yellow-400 ">
            Brighten Your Workflow
          </p>

          <p className="text-xl md:text-4xl font-black text-white mb-2 leading-tight">
            Welcome to <span className="text-yellow-400">DawnDesk</span>
          </p>

          <p className="text-white/60 text-base leading-relaxed mb-8 max-w-md">
            Tasks, notes, calendar, files, messages — everything you've been
            hunting across a dozen apps, finally in one place.
          </p>

          <Link
            to="/dashboard"
            className="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-neutral-900 font-bold py-2.5 px-6 rounded-lg transition-colors duration-150"
          >
            Explore DawnDesk
          </Link>
        </div>
      </div>
    </div>
    )
}