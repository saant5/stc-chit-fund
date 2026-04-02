// client/src/pages/Auctions.jsx
// Real-time Live Auction page with Socket.IO
import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const T = {
  gold:"#C9922A",goldLight:"#E5B253",goldDim:"#7a5718",
  goldBg:"rgba(201,146,42,0.08)",goldGlow:"rgba(201,146,42,0.2)",
  ink:"#0f0e0c",paper:"#faf8f3",paperDark:"#f2ede3",
  muted:"#6b6557",border:"rgba(201,146,42,0.2)",borderLight:"rgba(201,146,42,0.1)",
  white:"#ffffff",green:"#2e7d52",greenBg:"#edf7f1",
  red:"#b03a1a",redBg:"#fff4f0",blue:"#1a5fa8",blueBg:"#eef4fc",
  orange:"#c45c12",orangeBg:"#fff3ea",
  radius:"14px",radiusSm:"9px",shadow:"0 4px 24px rgba(15,14,12,0.07)",
};

function Skeleton({w="100%",h=20,r=6}){return <div style={{width:w,height:h,borderRadius:r,background:"linear-gradient(90deg,#f0ebe0 25%,#e8e2d6 50%,#f0ebe0 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.4s infinite"}}/>;}

function LiveTimer({startedAt}){
  const [elapsed,setElapsed]=useState(0);
  useEffect(()=>{
    if(!startedAt)return;
    const start=new Date(startedAt).getTime();
    const id=setInterval(()=>setElapsed(Math.floor((Date.now()-start)/1000)),1000);
    return()=>clearInterval(id);
  },[startedAt]);
  const h=Math.floor(elapsed/3600),m=Math.floor((elapsed%3600)/60),s=elapsed%60;
  return <span style={{fontFamily:"monospace",fontSize:"1.1rem",fontWeight:700,color:T.green}}>{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</span>;
}

function BidRow({bid,i}){
  const init=(bid.bidderName||"?").split(" ").map(n=>n[0]).join("").slice(0,2);
  return(
    <div style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.65rem 0",borderBottom:`1px solid ${T.borderLight}`,animation:"fadeUp 0.3s ease both",animationDelay:`${i*0.04}s`}}>
      <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:`${T.gold}20`,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",fontWeight:700,color:T.goldDim}}>{init}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:"0.82rem",fontWeight:600,color:T.ink}}>{bid.bidderName}</div>
        <div style={{fontSize:"0.68rem",color:T.muted}}>{new Date(bid.timestamp).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</div>
      </div>
      <div style={{fontSize:"1rem",fontWeight:800,color:T.gold,fontFamily:"'DM Serif Display',serif"}}>₹{bid.bidAmount.toLocaleString("en-IN")}</div>
      {i===0&&<span style={{background:T.greenBg,color:T.green,fontSize:"0.62rem",fontWeight:700,padding:"2px 8px",borderRadius:20}}>TOP</span>}
    </div>
  );
}

function AuctionCard({auction,onSelect,selected}){
  const isLive=auction.status==="live";
  return(
    <div onClick={()=>onSelect(auction)} style={{background:T.white,border:`1.5px solid ${selected?T.gold:isLive?T.green:T.border}`,borderRadius:T.radius,padding:"1.25rem",boxShadow:selected?`0 8px 28px ${T.goldGlow}`:T.shadow,cursor:"pointer",transition:"all 0.2s ease",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:isLive?`linear-gradient(90deg,${T.green},#4caf50)`:`linear-gradient(90deg,${T.gold},${T.goldLight})`}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.75rem"}}>
        <div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1rem",color:T.ink}}>{auction.groupName}</div>
          <div style={{fontSize:"0.72rem",color:T.muted}}>Month {auction.monthNumber}</div>
        </div>
        {isLive
          ?<span style={{background:T.greenBg,color:T.green,fontSize:"0.65rem",fontWeight:700,padding:"3px 10px",borderRadius:20,display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:"50%",background:T.green,animation:"pulse 1.2s ease infinite"}}/>LIVE</span>
          :<span style={{background:T.blueBg,color:T.blue,fontSize:"0.65rem",fontWeight:700,padding:"3px 10px",borderRadius:20}}>UPCOMING</span>
        }
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:"0.62rem",color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>Chit Value</div>
          <div style={{fontSize:"1.1rem",fontWeight:700,color:T.ink,fontFamily:"'DM Serif Display',serif"}}>₹{auction.chitAmount.toLocaleString("en-IN")}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:"0.62rem",color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>Current Bid</div>
          <div style={{fontSize:"1.1rem",fontWeight:700,color:auction.bidAmount>0?T.red:T.muted,fontFamily:"'DM Serif Display',serif"}}>{auction.bidAmount>0?`₹${auction.bidAmount.toLocaleString("en-IN")}`:"—"}</div>
        </div>
      </div>
      {isLive&&auction.startedAt&&<div style={{fontSize:"0.7rem",color:T.muted,marginTop:"0.6rem",display:"flex",alignItems:"center",gap:"0.4rem"}}>⏱ <LiveTimer startedAt={auction.startedAt}/></div>}
    </div>
  );
}

function PlaceBidForm({auction,socket,memberInfo,onBidPlaced}){
  const [bidAmount,setBidAmount]=useState("");
  const [error,setError]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [justBid,setJustBid]=useState(false);
  const currentBid=auction.bidAmount||0;
  const dividend=bidAmount&&parseInt(bidAmount)>0?Math.floor((auction.chitAmount-parseInt(bidAmount))/(auction.totalMembers||1)):0;

  const handleBid=()=>{
    setError("");
    const amount=parseInt(bidAmount);
    if(!amount||isNaN(amount)){setError("Enter a valid amount.");return;}
    if(amount>=auction.chitAmount){setError(`Must be less than ₹${auction.chitAmount.toLocaleString("en-IN")}`);return;}
    if(currentBid>0&&amount>=currentBid){setError(`Must be lower than ₹${currentBid.toLocaleString("en-IN")}`);return;}
    if(amount<1000){setError("Minimum bid is ₹1,000");return;}
    setSubmitting(true);
    socket.emit("auction:bid",{auctionId:auction.id,bidAmount:amount,bidderName:memberInfo?.name||"Member",memberId:memberInfo?.id});
    setBidAmount("");
    setTimeout(()=>{setSubmitting(false);setJustBid(true);setTimeout(()=>setJustBid(false),2000);},500);
    onBidPlaced(amount);
  };

  return(
    <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radius,padding:"1.5rem",boxShadow:T.shadow}}>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.1rem",color:T.ink,marginBottom:"1rem"}}>Place Your Bid</div>
      <div style={{background:T.goldBg,border:`1px solid ${T.border}`,borderRadius:T.radiusSm,padding:"0.75rem 0.9rem",marginBottom:"1.25rem",fontSize:"0.76rem",color:T.goldDim,lineHeight:1.6}}>
        💡 <strong>Chit fund bidding:</strong> Bid <em>lower</em> than the chit value. Lower bids = bigger dividend savings for all members.
      </div>
      {error&&<div style={{background:T.redBg,border:`1px solid ${T.red}`,borderRadius:T.radiusSm,padding:"0.6rem 0.9rem",marginBottom:"1rem",fontSize:"0.8rem",color:T.red}}>⚠ {error}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem",marginBottom:"1.25rem"}}>
        {[{label:"Chit Value",value:`₹${auction.chitAmount.toLocaleString("en-IN")}`,color:T.ink},{label:"Current Bid",value:currentBid>0?`₹${currentBid.toLocaleString("en-IN")}`:"No bids yet",color:currentBid>0?T.red:T.muted}].map((s,i)=>(
          <div key={i} style={{background:T.paper,borderRadius:T.radiusSm,padding:"0.6rem 0.8rem"}}>
            <div style={{fontSize:"0.62rem",color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>{s.label}</div>
            <div style={{fontSize:"0.92rem",fontWeight:700,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>
      <label style={{fontSize:"0.75rem",fontWeight:600,color:T.ink,display:"block",marginBottom:"0.4rem"}}>Your Bid Amount (₹)</label>
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.75rem"}}>
        <input type="number" value={bidAmount} onChange={e=>{setBidAmount(e.target.value);setError("");}}
          placeholder={currentBid>0?`Less than ${currentBid.toLocaleString("en-IN")}`:`Up to ${(auction.chitAmount-1).toLocaleString("en-IN")}`}
          style={{flex:1,padding:"0.75rem 0.9rem",border:`1.5px solid ${error?T.red:T.border}`,borderRadius:T.radiusSm,fontFamily:"'Sora',sans-serif",fontSize:"0.9rem",color:T.ink,background:T.paper,outline:"none"}}/>
        <button onClick={handleBid} disabled={submitting||justBid||!bidAmount} style={{padding:"0.75rem 1.2rem",background:justBid?T.green:submitting?T.muted:T.gold,border:"none",borderRadius:T.radiusSm,cursor:"pointer",fontSize:"0.88rem",fontWeight:700,color:"#fff",fontFamily:"'Sora',sans-serif",transition:"background 0.2s ease",whiteSpace:"nowrap"}}>
          {justBid?"✓ Placed!":submitting?"…":"Place Bid"}
        </button>
      </div>
      {bidAmount&&parseInt(bidAmount)>0&&parseInt(bidAmount)<auction.chitAmount&&(
        <div style={{background:T.greenBg,border:`1px solid ${T.green}30`,borderRadius:T.radiusSm,padding:"0.7rem 0.9rem",fontSize:"0.78rem",color:T.green,lineHeight:1.6}}>
          If this bid wins → Each member saves <strong>₹{dividend.toLocaleString("en-IN")}</strong> in dividend this month.
        </div>
      )}
      {currentBid>0&&(
        <div style={{marginTop:"0.75rem"}}>
          <div style={{fontSize:"0.68rem",color:T.muted,marginBottom:"0.4rem"}}>Quick bid:</div>
          <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
            {[5000,10000,25000,50000].map(step=>{const q=currentBid-step;if(q<1000)return null;return(
              <button key={step} onClick={()=>setBidAmount(String(q))} style={{padding:"3px 10px",fontSize:"0.72rem",background:T.paper,color:T.muted,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>₹{q.toLocaleString("en-IN")}</button>
            );}).filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Auctions(){
  const {user}=useAuth();
  const socketRef=useRef(null);
  const [tab,setTab]=useState("live");
  const [auctions,setAuctions]=useState([]);
  const [history,setHistory]=useState([]);
  const [selected,setSelected]=useState(null);
  const [bidLog,setBidLog]=useState([]);
  const [loading,setLoading]=useState(true);
  const [histLoading,setHistLoading]=useState(true);
  const [connected,setConnected]=useState(false);
  const [error,setError]=useState("");
  const memberInfo={name:user?.name,id:user?._id};

  const fetchLive=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const res=await API.get("/api/auctions/live");
      setAuctions(res.data||[]);
      if(res.data?.length)setSelected(prev=>prev||res.data.find(a=>a.status==="live")||res.data[0]);
    }catch{setError("Could not load auctions.");}
    finally{setLoading(false);}
  },[]);

  const fetchHistory=useCallback(async()=>{
    setHistLoading(true);
    try{const res=await API.get("/api/auctions/history");setHistory(res.data||[]);}catch{}
    finally{setHistLoading(false);}
  },[]);

  useEffect(()=>{fetchLive();},[fetchLive]);
  useEffect(()=>{if(tab==="history")fetchHistory();},[tab,fetchHistory]);

  useEffect(()=>{
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
  transports: ["websocket"]
});
    socketRef.current=socket;
    socket.on("connect",()=>setConnected(true));
    socket.on("disconnect",()=>setConnected(false));
    socket.on("auction:bid_placed",(data)=>{
      setBidLog(prev=>[data,...prev].slice(0,50));
      setAuctions(prev=>prev.map(a=>a.id===data.auctionId?{...a,bidAmount:data.bidAmount}:a));
      setSelected(prev=>prev?.id===data.auctionId?{...prev,bidAmount:data.bidAmount}:prev);
    });
    socket.on("auction:started",({auctionId})=>{
      setAuctions(prev=>prev.map(a=>a.id===auctionId?{...a,status:"live"}:a));
      setSelected(prev=>prev?.id===auctionId?{...prev,status:"live"}:prev);
    });
    socket.on("auction:closed",()=>fetchLive());
    socket.on("auction:error",({msg})=>setError(msg));
    return()=>socket.disconnect();
  },[]);

  useEffect(()=>{
    if(!selected||!socketRef.current)return;
    socketRef.current.emit("auction:join",{auctionId:selected.id});
    setBidLog([]);
    return()=>socketRef.current?.emit("auction:leave",{auctionId:selected.id});
  },[selected?.id]);

  const tabs=[{id:"live",label:"Live & Upcoming"},{id:"history",label:"Past Auctions"}];

  return(
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.4)}}
        .fade{animation:fadeUp 0.35s ease both}
      `}</style>

      {!connected&&<div style={{background:T.orangeBg,border:"1px solid #f5c89a",borderRadius:T.radiusSm,padding:"0.65rem 1rem",marginBottom:"1rem",fontSize:"0.8rem",color:T.orange}}>⚠ Connecting to real-time server…</div>}
      {error&&<div style={{background:T.redBg,border:`1px solid ${T.red}`,borderRadius:T.radiusSm,padding:"0.65rem 1rem",marginBottom:"1rem",fontSize:"0.8rem",color:T.red,display:"flex",justifyContent:"space-between"}}>⚠ {error}<button onClick={()=>setError("")} style={{background:"none",border:"none",cursor:"pointer",color:T.red,fontWeight:700}}>✕</button></div>}

      <div style={{display:"flex",gap:"0.25rem",marginBottom:"1.5rem",alignItems:"center"}}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"0.4rem 1rem",fontFamily:"'Sora',sans-serif",background:tab===t.id?`${T.gold}15`:"transparent",color:tab===t.id?T.gold:T.muted,border:`1px solid ${tab===t.id?T.border:"transparent"}`,borderRadius:8,fontSize:"0.8rem",fontWeight:tab===t.id?600:400,cursor:"pointer"}}>{t.label}</button>)}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"0.4rem",fontSize:"0.72rem",color:connected?T.green:T.muted}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:connected?T.green:T.muted,animation:connected?"pulse 2s ease infinite":"none"}}/>
          {connected?"Socket Live":"Offline"}
        </div>
      </div>

      {tab==="live"&&(
        <div className="fade">
          {loading?(
            <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:"1.25rem"}}>
              <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>{[1,2].map(i=><Skeleton key={i} h={160} r={14}/>)}</div>
              <Skeleton h={500} r={14}/>
            </div>
          ):auctions.length===0?(
            <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radius,padding:"4rem",textAlign:"center",boxShadow:T.shadow}}>
              <div style={{fontSize:"3rem",marginBottom:"0.75rem"}}>🔨</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.3rem",color:T.ink}}>No live auctions right now</div>
              <p style={{fontSize:"0.82rem",color:T.muted,marginTop:"0.5rem"}}>Auctions are started by the admin each month. Check back soon.</p>
              <button onClick={()=>setTab("history")} style={{marginTop:"1.25rem",padding:"0.65rem 1.4rem",background:T.gold,color:"#fff",border:"none",borderRadius:T.radiusSm,cursor:"pointer",fontSize:"0.85rem",fontWeight:700,fontFamily:"'Sora',sans-serif"}}>View Past Auctions →</button>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:"1.25rem"}}>
              <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                {auctions.map((a,i)=><AuctionCard key={i} auction={a} onSelect={setSelected} selected={selected?.id===a.id}/>)}
              </div>
              {selected?(
                <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
                  {/* Detail header */}
                  <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radius,padding:"1.5rem",boxShadow:T.shadow}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.25rem"}}>
                      <div>
                        <div style={{fontSize:"0.68rem",color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{selected.status==="live"?"🔴 Live Auction":"⏳ Upcoming"}</div>
                        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.6rem",color:T.ink}}>{selected.groupName}</div>
                        <div style={{fontSize:"0.78rem",color:T.muted,marginTop:2}}>Month {selected.monthNumber} · {selected.planName}</div>
                      </div>
                      {selected.status==="live"&&selected.startedAt&&(
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:"0.68rem",color:T.muted,marginBottom:4}}>Running for</div>
                          <LiveTimer startedAt={selected.startedAt}/>
                        </div>
                      )}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"0.75rem"}}>
                      {[
                        {label:"Chit Value",  value:`₹${selected.chitAmount.toLocaleString("en-IN")}`,color:T.ink},
                        {label:"Current Bid", value:selected.bidAmount>0?`₹${selected.bidAmount.toLocaleString("en-IN")}`:"No bids",color:selected.bidAmount>0?T.red:T.muted},
                        {label:"Est. Dividend",value:selected.bidAmount>0?`₹${Math.floor((selected.chitAmount-selected.bidAmount)/(selected.totalMembers||1)).toLocaleString("en-IN")}`:"—",color:T.green},
                        {label:"Members",     value:selected.totalMembers||0,color:T.blue},
                      ].map((s,i)=>(
                        <div key={i} style={{background:T.paper,borderRadius:T.radiusSm,padding:"0.75rem 1rem"}}>
                          <div style={{fontSize:"0.62rem",color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>{s.label}</div>
                          <div style={{fontSize:"1.1rem",fontWeight:700,color:s.color,fontFamily:"'DM Serif Display',serif"}}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Bid form + log */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.25rem"}}>
                    {selected.status==="live"
                      ?<PlaceBidForm auction={selected} socket={socketRef.current} memberInfo={memberInfo} onBidPlaced={amount=>setSelected(prev=>({...prev,bidAmount:amount}))}/>
                      :<div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radius,padding:"2rem",boxShadow:T.shadow,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"0.75rem"}}>
                        <div style={{fontSize:"2rem"}}>⏳</div>
                        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.1rem",color:T.ink}}>Auction Not Started Yet</div>
                        <p style={{fontSize:"0.78rem",color:T.muted}}>The admin will start this auction. You'll see bids here in real time.</p>
                      </div>
                    }
                    {/* Bid log */}
                    <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radius,padding:"1.5rem",boxShadow:T.shadow,display:"flex",flexDirection:"column",maxHeight:360}}>
                      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.1rem",color:T.ink,marginBottom:"1rem",flexShrink:0}}>Live Bid Feed</div>
                      {bidLog.length===0
                        ?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,fontSize:"0.82rem",textAlign:"center"}}>{selected.status==="live"?"No bids yet — be the first!":"Bids will appear here once auction starts."}</div>
                        :<div style={{overflowY:"auto",flex:1}}>{bidLog.map((bid,i)=><BidRow key={i} bid={bid} i={i}/>)}</div>
                      }
                    </div>
                  </div>
                </div>
              ):(
                <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radius,padding:"3rem",textAlign:"center",boxShadow:T.shadow}}>
                  <p style={{color:T.muted,fontSize:"0.85rem"}}>Select an auction from the left to view details.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab==="history"&&(
        <div className="fade">
          {histLoading
            ?<div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>{[1,2,3].map(i=><Skeleton key={i} h={80} r={14}/>)}</div>
            :history.length===0
              ?<div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radius,padding:"3rem",textAlign:"center",boxShadow:T.shadow}}><div style={{fontSize:"2rem",marginBottom:"0.5rem"}}>🔨</div><div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.1rem",color:T.ink}}>No completed auctions yet</div></div>
              :<div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                {history.map((a,i)=>(
                  <div key={i} style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radius,padding:"1.1rem 1.4rem",boxShadow:T.shadow,display:"flex",alignItems:"center",gap:"1.5rem",flexWrap:"wrap"}}>
                    <div style={{flex:2,minWidth:140}}>
                      <div style={{fontSize:"0.9rem",fontWeight:600,color:T.ink}}>{a.groupName}</div>
                      <div style={{fontSize:"0.72rem",color:T.muted}}>Month {a.monthNumber}</div>
                    </div>
                    <div style={{flex:1,minWidth:100}}>
                      <div style={{fontSize:"0.62rem",color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em"}}>Winner</div>
                      <div style={{fontSize:"0.88rem",fontWeight:600,color:T.ink}}>{a.winnerName||"—"}</div>
                    </div>
                    <div style={{flex:1,minWidth:120}}>
                      <div style={{fontSize:"0.62rem",color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em"}}>Winning Bid</div>
                      <div style={{fontSize:"0.92rem",fontWeight:700,color:T.gold,fontFamily:"'DM Serif Display',serif"}}>₹{a.bidAmount.toLocaleString("en-IN")}</div>
                    </div>
                    <div style={{flex:1,minWidth:100}}>
                      <div style={{fontSize:"0.62rem",color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em"}}>Dividend</div>
                      <div style={{fontSize:"0.88rem",fontWeight:600,color:T.green}}>₹{a.dividendPerMember.toLocaleString("en-IN")}</div>
                    </div>
                    <div style={{flex:1,minWidth:100}}>
                      <div style={{fontSize:"0.62rem",color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em"}}>Date</div>
                      <div style={{fontSize:"0.78rem",color:T.muted}}>{a.endedAt?new Date(a.endedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"}</div>
                    </div>
                    <span style={{background:T.paperDark,color:T.muted,fontSize:"0.68rem",fontWeight:600,padding:"3px 10px",borderRadius:20}}>Completed</span>
                  </div>
                ))}
              </div>
          }
        </div>
      )}
    </div>
  );
}