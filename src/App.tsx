import "./App.css";
function App() {
 
  return (
    <div className="flex flex-col items-center justify-center">
      <video
        className="fixed top-0 left-0 w-full h-full object-cover blur-sm"
        src="/sunflower_field_with_lake.mp4"
        autoPlay
        loop
        muted
      />
      <div className="relative w-full t-0 p-0 m-0 max-h-screen  z-10 flex flex-col items-center justify-center">
        <img
          src="/realistic_logo.png"
          alt="DawnDesk Logo"
          width={100}
          height={100}
          className=" w-[40vw]"
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

          <button className="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-neutral-900 font-bold py-2.5 px-6 rounded-lg transition-colors duration-150">
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
