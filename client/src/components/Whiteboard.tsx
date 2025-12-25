import React, { useRef, useState, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";
import {
    Pencil,
    Eraser,
    Trash2,
    Circle,
    Minus,
    Plus,
} from "lucide-react";

interface DrawData {
    type: "draw" | "erase";
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    color: string;
    lineWidth: number;
}

interface WhiteboardProps {
    socket: Socket | null;
    roomId: string | null;
    onClose: () => void;
}

const COLORS = [
    "#ffffff", // white
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
];

const Whiteboard: React.FC<WhiteboardProps> = ({ socket, roomId, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<"draw" | "erase">("draw");
    const [color, setColor] = useState("#ffffff");
    const [lineWidth, setLineWidth] = useState(3);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);

    // Draw a line segment on the canvas
    const drawLineOnCanvas = useCallback((data: DrawData) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(data.prevX, data.prevY);
        ctx.lineTo(data.x, data.y);

        if (data.type === "erase") {
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = data.lineWidth * 3;
        } else {
            ctx.strokeStyle = data.color;
            ctx.lineWidth = data.lineWidth;
        }

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
    }, []);

    // Clear the canvas
    const clearCanvasContent = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    // Initialize canvas size on mount
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        clearCanvasContent();
    }, [clearCanvasContent]);

    // Set up socket listeners - SEPARATE useEffect
    useEffect(() => {
        if (!socket) return;

        console.log("Setting up whiteboard socket listeners");

        const handleRemoteDraw = (data: DrawData) => {
            console.log("Received whiteboard-draw", data);
            drawLineOnCanvas(data);
        };

        const handleRemoteClear = () => {
            console.log("Received whiteboard-clear");
            clearCanvasContent();
        };

        const handleState = (state: DrawData[]) => {
            console.log("Received whiteboard-state with", state.length, "strokes");
            state.forEach((data) => drawLineOnCanvas(data));
        };

        socket.on("whiteboard-draw", handleRemoteDraw);
        socket.on("whiteboard-clear", handleRemoteClear);
        socket.on("whiteboard-state", handleState);

        return () => {
            console.log("Cleaning up whiteboard socket listeners");
            socket.off("whiteboard-draw", handleRemoteDraw);
            socket.off("whiteboard-clear", handleRemoteClear);
            socket.off("whiteboard-state", handleState);
        };
    }, [socket, drawLineOnCanvas, clearCanvasContent]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            clearCanvasContent();
            ctx.putImageData(imageData, 0, 0);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [clearCanvasContent]);

    // Get position from mouse/touch event
    const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        if ("touches" in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        lastPosRef.current = getPosition(e);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !lastPosRef.current) return;

        const pos = getPosition(e);
        const drawData: DrawData = {
            type: tool,
            x: pos.x,
            y: pos.y,
            prevX: lastPosRef.current.x,
            prevY: lastPosRef.current.y,
            color: color,
            lineWidth: lineWidth,
        };

        // Draw locally
        drawLineOnCanvas(drawData);

        // Send to server
        if (socket && roomId) {
            socket.emit("whiteboard-draw", { room: roomId, drawData });
        }

        lastPosRef.current = pos;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        lastPosRef.current = null;
    };

    const handleClear = () => {
        clearCanvasContent();
        if (socket && roomId) {
            socket.emit("whiteboard-clear", { room: roomId });
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="glass rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                        Collaborative Whiteboard
                    </h2>
                    <button onClick={onClose} className="btn-ghost p-2 rounded-lg">✕</button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-4 p-4 border-b border-white/10 flex-wrap">
                    {/* Tools */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setTool("draw")}
                            className={`p-3 rounded-xl transition-all ${tool === "draw" ? "bg-violet-500/30 border border-violet-500/50" : "btn-ghost"}`}
                            title="Brush"
                        >
                            <Pencil className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setTool("erase")}
                            className={`p-3 rounded-xl transition-all ${tool === "erase" ? "bg-violet-500/30 border border-violet-500/50" : "btn-ghost"}`}
                            title="Eraser"
                        >
                            <Eraser className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="w-px h-8 bg-white/10" />

                    {/* Colors */}
                    <div className="flex items-center gap-1">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); setTool("draw"); }}
                                className={`w-8 h-8 rounded-full transition-all border-2 ${color === c && tool === "draw" ? "border-white scale-110" : "border-transparent"}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    <div className="w-px h-8 bg-white/10" />

                    {/* Line Width */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => setLineWidth(Math.max(1, lineWidth - 1))} className="btn-ghost p-2 rounded-lg">
                            <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 min-w-[60px] justify-center">
                            <Circle className="text-white" style={{ width: lineWidth + 8, height: lineWidth + 8 }} fill="currentColor" />
                            <span className="text-sm text-white/60">{lineWidth}px</span>
                        </div>
                        <button onClick={() => setLineWidth(Math.min(20, lineWidth + 1))} className="btn-ghost p-2 rounded-lg">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1" />

                    {/* Clear */}
                    <button onClick={handleClear} className="btn-danger flex items-center gap-2 px-4 py-2 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                        Clear All
                    </button>
                </div>

                {/* Canvas */}
                <div className="flex-1 p-4">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full rounded-xl cursor-crosshair"
                        style={{ backgroundColor: "#1e293b" }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>

                {/* Footer */}
                <div className="p-2 text-center text-sm text-white/40 border-t border-white/10">
                    ⚠️ Both users need the whiteboard open to see drawings sync in real-time
                </div>
            </div>
        </div>
    );
};

export default Whiteboard;
