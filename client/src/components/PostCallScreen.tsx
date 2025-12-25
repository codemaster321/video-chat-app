import React from "react";
import { useCallStateContext } from "../context";
import { FileText, Download, Loader2, Video, Clock, Users, ArrowRight } from "lucide-react";

const PostCallScreen: React.FC = () => {
    const {
        meetingSummary,
        isSummaryLoading,
        summaryError,
        meetingTranscript,
        callDuration,
        lastParticipantCount,
        handleStartNewCall,
    } = useCallStateContext();

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const downloadSummary = () => {
        const content = `# Meeting Summary\n\n${meetingSummary}\n\n---\n\n## Full Transcript\n\n${meetingTranscript}`;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-summary-${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div
            className="animate-fade-in"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '90vh',
                padding: '48px 24px'
            }}
        >
            {/* Success Icon
            <div style={{ marginBottom: '32px' }}>
                <div
                    style={{
                        width: '88px',
                        height: '88px',
                        borderRadius: '50%',
                        background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <div
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'linear-gradient(145deg, #10b981, #059669)',
                            boxShadow: '0 12px 32px rgba(16, 185, 129, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <CheckCircle size={30} color="white" strokeWidth={2.5} />
                    </div>
                </div>
            </div> */}

            <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#fef3e2', marginBottom: '12px' }}>
                Call Ended
            </h1>

            <p style={{ fontSize: '18px', color: 'rgba(254, 243, 226, 0.5)', marginBottom: '48px' }}>
                Thanks for using NexusMeet
            </p>

            {/* Stats Cards */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '48px' }}>
                <div className="card-elevated" style={{ padding: '28px 40px', textAlign: 'center' }}>
                    <Clock size={22} style={{ margin: '0 auto 14px', color: '#fb923c' }} />
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#fef3e2', marginBottom: '6px' }}>
                        {formatDuration(callDuration)}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(254, 243, 226, 0.4)' }}>
                        Duration
                    </div>
                </div>
                <div className="card-elevated" style={{ padding: '28px 40px', textAlign: 'center' }}>
                    <Users size={22} style={{ margin: '0 auto 14px', color: '#fbbf24' }} />
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#fef3e2', marginBottom: '6px' }}>
                        {lastParticipantCount}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(254, 243, 226, 0.4)' }}>
                        Participants
                    </div>
                </div>
            </div>

            {/* AI Summary Card */}
            <div className="card-elevated" style={{ width: '100%', maxWidth: '520px', overflow: 'hidden' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px 24px',
                        borderBottom: '1px solid rgba(254, 243, 226, 0.06)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'linear-gradient(145deg, #f97316, #ea580c)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <FileText size={20} color="white" strokeWidth={2} />
                        </div>
                        <div>
                            <span style={{ fontWeight: 600, fontSize: '16px', color: '#fef3e2' }}>AI Summary</span>
                            <span style={{ fontSize: '11px', color: 'rgba(254, 243, 226, 0.4)', marginLeft: '10px' }}>GPT</span>
                        </div>
                    </div>
                    {meetingSummary && (
                        <button onClick={downloadSummary} className="icon-btn" style={{ width: '36px', height: '36px' }} title="Download">
                            <Download size={16} />
                        </button>
                    )}
                </div>

                <div style={{ padding: '24px' }}>
                    {isSummaryLoading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0' }}>
                            <Loader2 size={24} className="animate-spin" style={{ color: '#fb923c' }} />
                            <span style={{ fontSize: '14px', marginTop: '16px', color: 'rgba(254, 243, 226, 0.5)' }}>
                                Generating summary...
                            </span>
                        </div>
                    )}

                    {summaryError && (
                        <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                            <p style={{ color: '#fb7185' }}>{summaryError}</p>
                        </div>
                    )}

                    {meetingSummary && !isSummaryLoading && (
                        <div style={{ color: 'rgba(254, 243, 226, 0.75)', fontSize: '15px', lineHeight: 1.7 }}>
                            {meetingSummary.split('\n').slice(0, 5).map((line, i) => (
                                <p key={i} style={{ marginBottom: '10px' }}>{line}</p>
                            ))}
                        </div>
                    )}

                    {!meetingTranscript && !isSummaryLoading && !summaryError && (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                            <p style={{ color: 'rgba(254, 243, 226, 0.4)', marginBottom: '6px' }}>No transcript available</p>
                            <p style={{ color: 'rgba(254, 243, 226, 0.3)', fontSize: '13px' }}>Enable captions during calls</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '48px' }}>
                <button onClick={handleStartNewCall} className="btn-secondary">Close</button>
                <button onClick={handleStartNewCall} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Video size={18} />
                    New Call
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default PostCallScreen;
