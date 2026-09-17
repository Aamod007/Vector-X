"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertOctagon,
  Bot,
  Globe,
  RotateCcw,
  Send,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";

export function DashboardSidebarControls() {
  const {
    messages,
    isAiResponding,
    submitAiPrompt,
    clearChat,
  } = useDashboardStore();

  const [inputPrompt, setInputPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiResponding]);

  const handleSendPrompt = async () => {
    if (!inputPrompt.trim() || isAiResponding) return;
    const prompt = inputPrompt;
    setInputPrompt("");
    await submitAiPrompt(prompt);
  };

  const quickPrompts = [
    { label: "Critical Alerts", icon: AlertOctagon, color: "#ef4444", prompt: "Show critical endpoint alerts only" },
    { label: "Top Failed Logins", icon: Users, color: "#3b82f6", prompt: "Show me the top 5 users with the most failed login attempts in the last 30 days, along with their attempt counts and severity" },
    { label: "Threat Sources", icon: Globe, color: "#8b5cf6", prompt: "Which countries have the highest threats?" },
    { label: "Firewall Blocks", icon: Shield, color: "#10b981", prompt: "Summarize firewall blocked attacks" },
    { label: "High-Risk Host", icon: Zap, color: "#f59e0b", prompt: "Which host has the maximum threat flags?" },
    { label: "Reset All", icon: RotateCcw, color: "#64748b", prompt: "Reset dashboard filters" },
  ];

  return (
    <div className="single-chatbot-sidebar">
      {/* ─── CHATBOT HEADER ─── */}
      <div className="chatbot-header">
        <div className="chatbot-header-title">
          <div className="chatbot-icon-badge">
            <Sparkles size={14} style={{ color: "#2563eb" }} />
          </div>
          <div>
            <div className="chatbot-name">CYBERSHIELD COPILOT</div>
            <div className="chatbot-subtitle">Real Track 2 Telemetry</div>
          </div>
        </div>

        <div className="chatbot-header-actions">
          <span className="live-pulse-dot" title="Live dataset connected" />
          <button
            type="button"
            className="chatbot-clear-btn"
            onClick={clearChat}
            title="Clear conversation"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* ─── SCROLLABLE MESSAGE STREAM ─── */}
      <div className="chatbot-messages-area">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chatbot-bubble ${msg.sender === "user" ? "user-bubble" : "assistant-bubble"}`}
          >
            <div className="chatbot-bubble-meta">
              <span className="chatbot-sender-tag">
                {msg.sender === "user" ? "You" : "CyberShield AI"}
              </span>
              <span className="chatbot-time-tag">{msg.timestamp}</span>
            </div>
            <p className="chatbot-text">{msg.text}</p>
            {msg.actionTag && (
              <div className="chatbot-action-tag">
                <Zap size={10} />
                <span>{msg.actionTag}</span>
              </div>
            )}
          </div>
        ))}

        {isAiResponding && (
          <div className="chatbot-bubble assistant-bubble typing">
            <div className="typing-indicator">
              <span />
              <span />
              <span />
            </div>
            <span style={{ fontSize: 11, color: "#64748b" }}>Analyzing real dataset...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── QUICK SUGGESTION CHIPS ─── */}
      <div className="chatbot-quick-chips">
        {quickPrompts.map((qp) => {
          const IconComp = qp.icon;
          return (
            <button
              key={qp.label}
              type="button"
              className="chatbot-chip"
              style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
              disabled={isAiResponding}
              onClick={() => {
                void submitAiPrompt(qp.prompt);
              }}
            >
              <IconComp size={11} style={{ color: qp.color, flexShrink: 0 }} />
              <span>{qp.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── INPUT FORM AT BOTTOM ─── */}
      <form
        className="chatbot-input-bar"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSendPrompt();
        }}
      >
        <input
          type="text"
          className="chatbot-input"
          placeholder="Ask AI to filter or query real dataset..."
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          disabled={isAiResponding}
        />
        <button
          type="submit"
          className="chatbot-send-btn"
          disabled={!inputPrompt.trim() || isAiResponding}
          title="Send query"
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
