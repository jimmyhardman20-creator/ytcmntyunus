import React, { useState, useEffect, useMemo } from 'react';
import { 
  Youtube, MessageSquare, Hash, Clock, Users, Activity, Trash2, Wifi, WifiOff 
} from 'lucide-react';
import { io } from 'socket.io-client';

// Backend URL auto-detect
const SERVER_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:3001' 
  : window.location.origin;

const socket = io(SERVER_URL);

const App = () => {
  const [activeTab, setActiveTab] = useState('comments');
  const [comments, setComments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Listen for workers list from server
    socket.on('worker_update', (workerList) => {
      console.log("Updated Workers:", workerList);
      setWorkers(workerList);
    });

    socket.on('new_comment', (comment) => setComments(prev => [comment, ...prev]));
    socket.on('new_job', (job) => setJobs(prev => [job, ...prev]));
    socket.on('clear_comments', () => setComments([]));

    return () => {
      socket.off('worker_update');
      socket.off('new_comment');
      socket.off('new_job');
      socket.off('clear_comments');
    };
  }, []);

  const filteredData = useMemo(() => {
    const uniqueUsers = new Set();
    const general = [];
    const numbered = [];
    [...comments].reverse().forEach(item => {
      const name = item.userName?.toLowerCase().trim();
      if (name && !uniqueUsers.has(name)) {
        uniqueUsers.add(name);
        if (/\d+/.test(item.text)) numbered.push(item);
        else general.push(item);
      }
    });
    return { general: general.reverse(), numbered: numbered.reverse() };
  }, [comments]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg"><Youtube size={24} /></div>
          <h1 className="text-xl font-black">YT Admin</h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border">
          <button onClick={() => setActiveTab('comments')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'comments' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Comments</button>
          <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'jobs' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Jobs</button>
          <button onClick={() => setActiveTab('workers')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'workers' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Workers ({workers.length})</button>
        </div>
        <button onClick={() => fetch(`${SERVER_URL}/api/comments`, {method: 'DELETE'})} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={20} /></button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'comments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="font-black text-lg flex justify-between items-center">Unique Users <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs">{filteredData.general.length}</span></h2>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {filteredData.general.map(c => (
                  <div key={c.id} className="bg-white p-4 rounded-xl border flex gap-3 shadow-sm">
                    <div className="bg-blue-50 h-10 w-10 rounded-lg flex items-center justify-center text-blue-600 font-bold">{c.userName?.[0]}</div>
                    <div><p className="font-bold text-sm">{c.userName}</p><p className="text-slate-600 text-sm">{c.text}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="font-black text-lg flex justify-between items-center">Priority Numbers <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-xs">{filteredData.numbered.length}</span></h2>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {filteredData.numbered.map(c => (
                  <div key={c.id} className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3">
                    <Hash className="text-emerald-500" size={20} />
                    <div><p className="font-bold text-emerald-900 text-sm">{c.userName}</p><p className="text-emerald-800 text-sm">{c.text}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workers' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Activity className="text-blue-400" /> Real-time Worker List</h3>
              <div className="grid gap-4">
                {workers.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-700 rounded-2xl text-slate-500">Kono worker connect hoyni.</div>
                ) : (
                  workers.map(w => (
                    <div key={w.id} className="bg-slate-800 p-5 rounded-2xl flex items-center justify-between border border-slate-700">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Users size={20} /></div>
                        <div><p className="font-black">{w.name}</p><p className="text-[10px] text-slate-500 font-mono">Socket ID: {w.id}</p></div>
                      </div>
                      <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-500/20 animate-pulse">Online</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-3 border">
        <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isConnected ? 'Server Online' : 'Offline'}</span>
      </div>
    </div>
  );
};

export default App;
