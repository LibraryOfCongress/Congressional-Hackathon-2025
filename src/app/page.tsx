import TranscriptFieldAndOutput from "@/components/TranscriptFieldAndOutput";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-center">
        <h1 className="text-center text-3xl" >How Active is Your Congressperson?</h1>
        <TranscriptFieldAndOutput />
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <p
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        >
          A Congressional Hackathon Project
        </p>
      </footer>
    </div>
  );
}
