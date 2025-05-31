"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { vapi } from "@/lib/vapi";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquare, X } from "lucide-react";

const GenerateProgramPage = () => {
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [callEnded, setCallEnded] = useState(false);
  const [currentPartialMessage, setCurrentPartialMessage] = useState("");
  const [currentSpeaker, setCurrentSpeaker] = useState<
    "assistant" | "user" | null
  >(null);
  
  // NEW: States for handling message consolidation
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const [consolidationTimer, setConsolidationTimer] = useState<NodeJS.Timeout | null>(null);
  
  // NEW: Message panel states
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [messagePanelWidth, setMessagePanelWidth] = useState(400); // default width
  const [isResizing, setIsResizing] = useState(false);

  const { user } = useUser();
  const router = useRouter();

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Constants for panel sizing
  const MIN_PANEL_WIDTH = 320;
  const MAX_PANEL_WIDTH = 600;

  // SOLUTION to get rid of "Meeting has ended" error
  useEffect(() => {
    const originalError = console.error;

    console.error = function (msg, ...args) {
      const msgStr = typeof msg === "string" ? msg : JSON.stringify(msg);

      if (
        msgStr.includes("Meeting has ended") ||
        (args[0] && args[0].toString().includes("Meeting has ended"))
      ) {
        console.log("Ignoring known error: Meeting has ended");
        return;
      }

      return originalError.call(console, msg, ...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // auto-scroll messages
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages, currentPartialMessage]);

  useEffect(() => {
    console.log("Assistant ID:", process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID);
  }, []);

  // navigate user to profile page after the call ends
  useEffect(() => {
    if (callEnded) {
      const redirectTimer = setTimeout(() => {
        router.push("/profile");
      }, 3000);

      return () => clearTimeout(redirectTimer);
    }
  }, [callEnded, router]);

  // Show message panel when call starts
  useEffect(() => {
    if (callActive && !showMessagePanel) {
      setShowMessagePanel(true);
    }
  }, [callActive, showMessagePanel]);

  // Handle mouse resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, newWidth));
      setMessagePanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing]);

  // FIXED: Enhanced event listeners for better message handling
  useEffect(() => {
    const handleCallStart = () => {
      console.log("Call started");
      setConnecting(false);
      setCallActive(true);
      setCallEnded(false);
      setMessages([]);
      setCurrentPartialMessage("");
      setCurrentSpeaker(null);
    };

    const handleCallEnd = () => {
      console.log("Call ended");
      setCallActive(false);
      setConnecting(false);
      setIsSpeaking(false);
      setCallEnded(true);

      // Clear partial message when call ends
      if (currentPartialMessage && currentSpeaker) {
        setMessages((prev) => [
          ...prev,
          {
            content: currentPartialMessage,
            role: currentSpeaker,
            timestamp: Date.now()
          },
        ]);
      }
      setCurrentPartialMessage("");
      setCurrentSpeaker(null);
      
      // Clear consolidation timer
      if (consolidationTimer) {
        clearTimeout(consolidationTimer);
        setConsolidationTimer(null);
      }
    };

    const handleSpeechStart = () => {
      console.log("AI started Speaking");
      setIsSpeaking(true);
    };

    const handleSpeechEnd = () => {
      console.log("AI stopped Speaking");
      setIsSpeaking(false);
    };

    // ENHANCED: Better message handling with consolidation for pauses
    const handleMessage = (message: any) => {
      console.log("Message received:", message);

      if (message.type === "transcript") {
        const speaker = message.role;
        const text = message.transcript;
        const currentTime = Date.now();

        if (message.transcriptType === "partial") {
          // For partial transcripts, update the current partial message
          setCurrentPartialMessage(text);
          setCurrentSpeaker(speaker);
        } else if (message.transcriptType === "final") {
          // Clear any existing consolidation timer
          if (consolidationTimer) {
            clearTimeout(consolidationTimer);
            setConsolidationTimer(null);
          }

          const timeSinceLastMessage = currentTime - lastMessageTime;
          const CONSOLIDATION_WINDOW = 3000; // 3 seconds to consolidate messages

          setLastMessageTime(currentTime);

          // Check if we should consolidate with the previous message
          const shouldConsolidate = 
            timeSinceLastMessage < CONSOLIDATION_WINDOW &&
            messages.length > 0 &&
            messages[messages.length - 1].role === speaker &&
            text.trim().length > 0;

          if (shouldConsolidate) {
            // Consolidate with the previous message
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              
              // Add a space between messages if the previous doesn't end with punctuation
              const separator = /[.!?]$/.test(lastMessage.content.trim()) ? ' ' : ' ';
              lastMessage.content = lastMessage.content + separator + text;
              
              return newMessages;
            });
          } else {
            // Add as a new message
            if (text.trim().length > 0) {
              const finalMessage = { 
                content: text.trim(), 
                role: speaker,
                timestamp: currentTime
              };
              setMessages((prev) => [...prev, finalMessage]);
            }
          }

          // Set a timer to prevent further consolidation after a delay
          const timer = setTimeout(() => {
            setConsolidationTimer(null);
          }, CONSOLIDATION_WINDOW);
          
          setConsolidationTimer(timer);
          setCurrentPartialMessage("");
          setCurrentSpeaker(null);
        }
      }

      // Handle function calls (when AI calls your endpoint)
      if (message.type === "function-call") {
        console.log("Function call detected:", message);
        // You can add UI feedback here if needed
      }
    };

    const handleError = (error: any) => {
      console.log("Vapi Error", error);
      setConnecting(false);
      setCallActive(false);
    };

    vapi
      .on("call-start", handleCallStart)
      .on("call-end", handleCallEnd)
      .on("speech-start", handleSpeechStart)
      .on("speech-end", handleSpeechEnd)
      .on("message", handleMessage)
      .on("error", handleError);

    // cleanup event listeners on unmount
    return () => {
      // Clear any active timers
      if (consolidationTimer) {
        clearTimeout(consolidationTimer);
      }
      
      vapi
        .off("call-start", handleCallStart)
        .off("call-end", handleCallEnd)
        .off("speech-start", handleSpeechStart)
        .off("speech-end", handleSpeechEnd)
        .off("message", handleMessage)
        .off("error", handleError);
    };
  }, [currentPartialMessage, currentSpeaker, consolidationTimer, messages, lastMessageTime]);

  const toggleCall = async () => {
    if (callActive) {
      try {
        console.log("Attempting to stop call...");
        await vapi.stop();
      } catch (error) {
        console.log("Error stopping call:", error);
        setCallActive(false);
        setConnecting(false);
        setIsSpeaking(false);
        setCallEnded(true);
      }
    } else {
      try {
        setConnecting(true);
        setMessages([]);
        setCallEnded(false);
        setCurrentPartialMessage("");
        setCurrentSpeaker(null);
        setLastMessageTime(0);
        
        // Clear any existing consolidation timer
        if (consolidationTimer) {
          clearTimeout(consolidationTimer);
          setConsolidationTimer(null);
        }

        // FIXED: Better name handling for AI greeting
        const firstName = user?.firstName || "";
        const lastName = user?.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim() || "there";

        console.log("Starting call with user:", fullName);
        console.log(
          "Starting call with Assistant ID:",
          process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID
        );

        await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, {
          variableValues: {
            user_name: firstName,
            full_name: fullName,
            user_id: user?.id,
          },
        });
      } catch (error) {
        console.log("Failed to start call", error);
        setConnecting(false);
      }
    }
  };

  const toggleMessagePanel = () => {
    setShowMessagePanel(!showMessagePanel);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const expandPanel = () => {
    setMessagePanelWidth(Math.min(messagePanelWidth + 50, MAX_PANEL_WIDTH));
  };

  const shrinkPanel = () => {
    setMessagePanelWidth(Math.max(messagePanelWidth - 50, MIN_PANEL_WIDTH));
  };

  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden pb-6 pt-24 relative">
      <div 
        className={`container mx-auto px-4 h-full max-w-5xl transition-all duration-300 ${
          showMessagePanel ? 'mr-0' : ''
        }`}
        style={{
          marginRight: showMessagePanel ? `${messagePanelWidth}px` : '0',
        }}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono">
            <span>Generate Your </span>
            <span className="text-primary uppercase">Fitness Program</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Have a voice conversation with our AI assistant to create your
            personalized plan
          </p>
        </div>

        {/* VIDEO CALL AREA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* AI ASSISTANT CARD */}
          <Card className="bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative">
            <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
              {/* AI VOICE ANIMATION */}
              <div
                className={`absolute inset-0 ${
                  isSpeaking ? "opacity-30" : "opacity-0"
                } transition-opacity duration-300`}
              >
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center h-20">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`mx-1 h-16 w-1 bg-primary rounded-full ${
                        isSpeaking ? "animate-sound-wave" : ""
                      }`}
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        height: isSpeaking
                          ? `${Math.random() * 50 + 20}%`
                          : "5%",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* AI IMAGE */}
              <div className="relative size-32 mb-4">
                <div
                  className={`absolute inset-0 bg-primary opacity-10 rounded-full blur-lg ${
                    isSpeaking ? "animate-pulse" : ""
                  }`}
                />

                <div className="relative w-full h-full rounded-full bg-card flex items-center justify-center border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-secondary/10"></div>
                  <img
                    src="/ai-trainer.png"
                    alt="AI Assistant"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground">
                FitMentor AI
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your Fitness & Diet Coach
              </p>
              {/* SPEAKING INDICATOR */}
              <div
                className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border ${
                  isSpeaking ? "border-primary" : ""
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSpeaking ? "bg-primary animate-pulse" : "bg-muted"
                  }`}
                />

                <span className="text-xs text-muted-foreground">
                  {isSpeaking
                    ? "Speaking..."
                    : callActive
                      ? "Listening..."
                      : callEnded
                        ? "Generating your plans..."
                        : "Waiting..."}
                </span>
              </div>
            </div>
          </Card>

          {/* USER CARD */}
          <Card
            className={`bg-card/90 backdrop-blur-sm border overflow-hidden relative`}
          >
            <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
              {/* User Image */}
              <div className="relative size-32 mb-4">
                <img
                  src={user?.imageUrl}
                  alt="User"
                  className="size-full object-cover rounded-full"
                />
              </div>

              <h2 className="text-xl font-bold text-foreground">You</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {user
                  ? (user.firstName + " " + (user.lastName || "")).trim()
                  : "Guest"}
              </p>

              {/* User Ready Text */}
              <div
                className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border`}
              >
                <div className={`w-2 h-2 rounded-full bg-muted`} />
                <span className="text-xs text-muted-foreground">Ready</span>
              </div>
            </div>
          </Card>
        </div>

        {/* CALL CONTROLS */}
        <div className="w-full flex justify-center gap-4">
          <Button
            className={`w-40 text-xl rounded-3xl ${
              callActive
                ? "bg-destructive hover:bg-destructive/90"
                : callEnded
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-primary hover:bg-primary/90"
            } text-white relative`}
            onClick={toggleCall}
            disabled={connecting || callEnded}
          >
            {connecting && (
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/50 opacity-75"></span>
            )}

            <span>
              {callActive
                ? "End Call"
                : connecting
                  ? "Connecting..."
                  : callEnded
                    ? "Generating Plans..."
                    : "Start Call"}
            </span>
          </Button>

          {/* Message Panel Toggle Button */}
          {(callActive || messages.length > 0 || callEnded) && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMessagePanel}
              className="w-12 h-12 rounded-full"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* MESSAGE PANEL - Slide in from right */}
      <div
        className={`fixed top-0 right-0 h-full bg-card/95 backdrop-blur-sm border-l border-border shadow-2xl transition-transform duration-300 ease-in-out z-50 ${
          showMessagePanel ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: `${messagePanelWidth}px` }}
      >
        {/* Resize Handle */}
        <div
          ref={resizeRef}
          className="absolute left-0 top-0 w-1 h-full cursor-col-resize bg-border hover:bg-primary transition-colors duration-200 group"
          onMouseDown={handleResizeStart}
        >
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-8 bg-border group-hover:bg-primary rounded-r-md transition-colors duration-200" />
        </div>

        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation
          </h3>
          <div className="flex items-center gap-2">
            {/* Width Controls */}
            <Button
              variant="ghost"
              size="icon"
              onClick={shrinkPanel}
              disabled={messagePanelWidth <= MIN_PANEL_WIDTH}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={expandPanel}
              disabled={messagePanelWidth >= MAX_PANEL_WIDTH}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMessagePanel}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Container */}
        <div
          ref={messageContainerRef}
          className="flex-1 p-4 overflow-y-auto h-full pb-20"
          style={{ height: 'calc(100vh - 80px)' }}
        >
          {messages.length === 0 && !currentPartialMessage && !callEnded && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation to see messages here</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {msg.role === "user" ? "You" : "FitMentor AI"}
                  </div>
                  {msg.content}
                </div>
              </div>
            ))}

            {currentPartialMessage && currentSpeaker && (
              <div
                className={`flex ${currentSpeaker === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`text-sm rounded-lg px-3 py-2 max-w-[85%] italic opacity-70 ${
                    currentSpeaker === "user"
                      ? "bg-primary/70 text-primary-foreground"
                      : "bg-muted/70 text-foreground"
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {currentSpeaker === "user" ? "You" : "FitMentor AI"} (typing...)
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    {currentPartialMessage}
                  </div>
                </div>
              </div>
            )}

            {callEnded && (
              <div className="flex justify-center">
                <div className="text-sm rounded-lg px-4 py-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700">
                  <div className="text-xs font-semibold mb-1">System</div>
                  <p>
                    Great conversation! I'm now generating your personalized fitness and meal plans. 
                    This may take a moment. Redirecting to your profile...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay when panel is open on smaller screens */}
      {showMessagePanel && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleMessagePanel}
        />
      )}
    </div>
  );
};

export default GenerateProgramPage;