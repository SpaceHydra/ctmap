import React, { useState, useRef, useEffect } from 'react';
import { Assignment, AssignmentStatus, User, UserRole } from '../types';
import { store } from '../services/mockStore';
import { Sparkles, X, Send, Bot, User as UserIcon, LayoutDashboard, FileText, AlertTriangle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface AiAssistantProps {
  user: User;
  assignment?: Assignment;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ user, assignment }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset chat when context changes (e.g. going from Dashboard to Assignment)
  useEffect(() => {
    const contextMsg = assignment 
        ? `I have switched context to assignment **${assignment.lan}**. Ask me about status, borrower details, risks, or timeline!`
        : `Hello ${user.name}! I am your Dashboard Assistant. I have access to your live workload stats. How can I help?`;

    setMessages([{
        id: 'welcome-' + Date.now(),
        sender: 'ai',
        text: contextMsg,
        timestamp: new Date()
    }]);
  }, [assignment?.id, user.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const getDashboardContext = () => {
      const allAssignments = store.getAssignments();
      const advocates = store.getAdvocates();

      if (user.role === UserRole.BANK_USER) {
          const myAssignments = allAssignments.filter(a => a.ownerId === user.id);
          return {
              role: 'Bank User',
              totalAssignments: myAssignments.length,
              drafts: myAssignments.filter(a => a.status === AssignmentStatus.DRAFT).length,
              inProgress: myAssignments.filter(a => a.status === AssignmentStatus.IN_PROGRESS).length,
              pendingApproval: myAssignments.filter(a => a.status === AssignmentStatus.PENDING_APPROVAL).length,
              queriesRaised: myAssignments.filter(a => a.status === AssignmentStatus.QUERY_RAISED).length
          };
      } 
      
      if (user.role === UserRole.CT_OPS) {
          const pendingAlloc = allAssignments.filter(a => a.status === AssignmentStatus.PENDING_ALLOCATION).length;
          const stuck = allAssignments.filter(a => {
                if (!a.createdAt) return false;
                const days = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 3600 * 24);
                return days > 7 && a.status !== AssignmentStatus.COMPLETED;
          }).length;
          return {
              role: 'CT Operations',
              pipelineTotal: allAssignments.length,
              pendingAllocation: pendingAlloc,
              stuckAssignments: stuck,
              networkSize: advocates.length,
              availableAdvocates: advocates.filter(a => store.getAdvocateWorkload(a.id) < 3).length
          };
      }

      if (user.role === UserRole.ADVOCATE) {
          const myCases = allAssignments.filter(a => a.advocateId === user.id);
          const dueSoon = myCases.filter(a => a.dueDate && new Date(a.dueDate) > new Date() && new Date(a.dueDate) < new Date(Date.now() + 86400000*3)).length;
          return {
              role: 'Advocate',
              activeCases: myCases.filter(a => a.status === AssignmentStatus.IN_PROGRESS || a.status === AssignmentStatus.ALLOCATED).length,
              queriesPending: myCases.filter(a => a.status === AssignmentStatus.QUERY_RAISED).length,
              dueSoon: dueSoon
          };
      }
      return {};
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsTyping(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Build Dynamic Context
        let contextData = "";
        let contextDescription = "";

        if (assignment) {
            contextDescription = "The user is viewing a specific assignment. Use the JSON data below to answer specific questions about the loan, borrower, property, or status.";
            // Sanitizing data to send only relevant info to save tokens/complexity
            const { auditTrail, ...cleanAssignment } = assignment; 
            contextData = JSON.stringify(cleanAssignment, null, 2);
        } else {
            contextDescription = `The user is on their main Dashboard. They are a ${user.role}. Use the statistical summary below to answer questions about their workload, pipeline, or tasks.`;
            contextData = JSON.stringify(getDashboardContext(), null, 2);
        }

        const systemInstruction = `You are 'CT Genius', an intelligent, professional, and efficient AI assistant for the CT MAP Title Search Portal.
        
        Current User: ${user.name} (${user.role})
        
        Context Situation: ${contextDescription}
        
        Context Data:
        ${contextData}

        Guidelines:
        1. Be concise and professional.
        2. Use bold text for key metrics or status (e.g., **PENDING APPROVAL**).
        3. If asked about risks, analyze the data (e.g., queries raised, delays, complex product types like Business Loan).
        4. If the answer is not in the context, politely say you don't have that information.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: query,
            config: {
                systemInstruction: systemInstruction
            }
        });

        const aiText = response.text || "I'm having trouble connecting to my brain right now. Please try again.";

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: aiText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
        console.error("AI Error", error);
        const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: "I'm sorry, I encountered an error connecting to the AI service. Please check your API key configuration.",
            timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 group"
        >
          <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
          <span className="font-bold text-sm">Ask CT Genius</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
             <div className="flex items-center gap-2">
                 <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                 </div>
                 <div>
                     <h3 className="font-bold text-sm">CT Genius AI</h3>
                     <p className="text-[10px] text-indigo-100 opacity-90 flex items-center gap-1">
                         {assignment ? <FileText className="w-3 h-3" /> : <LayoutDashboard className="w-3 h-3" />}
                         {assignment ? 'Assignment Context' : 'Dashboard Context'}
                     </p>
                 </div>
             </div>
             <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X className="w-4 h-4" /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
             {messages.map((msg) => (
                 <div key={msg.id} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'ai' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
                         {msg.sender === 'ai' ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                     </div>
                     <div className={`max-w-[80%] rounded-xl p-3 text-sm shadow-sm ${
                         msg.sender === 'user' 
                         ? 'bg-indigo-600 text-white rounded-tr-none' 
                         : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                     }`}>
                         {msg.text.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-1' : ''} dangerouslySetInnerHTML={{ 
                             __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                         }} />)}
                         <p className={`text-[9px] mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                             {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </p>
                     </div>
                 </div>
             ))}
             {isTyping && (
                 <div className="flex gap-2">
                     <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center"><Bot className="w-4 h-4 text-indigo-600" /></div>
                     <div className="bg-white border border-slate-100 rounded-xl rounded-tl-none p-3 flex items-center gap-1">
                         <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                         <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                         <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                     </div>
                 </div>
             )}
             <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <input 
                 className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                 placeholder={assignment ? "Ask about this assignment..." : "Ask about your dashboard..."}
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={!query.trim() || isTyping}
                className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                  <Send className="w-4 h-4" />
              </button>
          </form>
        </div>
      )}
    </>
  );
};