import { Link } from "react-router-dom";

export default function Home(){
    return(
          <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <video
        className="fixed top-0 left-0 w-full h-full object-cover blur-sm"
        src="/sunflower_field_with_lake.mp4"
        autoPlay
        loop
        muted
      />
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-6 py-10 text-center">
        <img
          src="/realistic_logo.png"
          alt="DawnDesk Logo"
          width={100}
          height={100}
          className="mb-2 w-[min(36vw,260px)] min-w-[150px]"
        />
        <div className="flex max-w-3xl flex-col items-center justify-center">
          <h1 className="mb-4 text-5xl font-bold text-white sm:text-6xl md:text-7xl xl:text-8xl">DawnDesk</h1>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-yellow-400 ">
            Brighten Your Workflow
          </p>

          <p className="mb-3 mt-2 text-3xl font-black leading-tight text-white md:text-4xl">
            Welcome to <span className="text-yellow-400">DawnDesk</span>
          </p>

          <p className="mb-8 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
            Tasks, notes, calendar, files, messages — everything you've been
            hunting across a dozen apps, finally in one place.
          </p>

          <Link
            to="/auth"
            className="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-neutral-900 font-bold py-2.5 px-6 rounded-lg transition-colors duration-150"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
    )
}
