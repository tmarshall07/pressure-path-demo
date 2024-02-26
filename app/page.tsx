import App from '@/components/App';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-10">
      <div className="z-10 max-w-4xl w-full items-center justify-between font-mono text-sm lg:flex">
        <App />
      </div>
    </main>
  );
}
