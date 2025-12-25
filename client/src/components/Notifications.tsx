import React from "react";
import { UserPlus } from "lucide-react";

interface NotificationsProps {
    notifications: string[];
}

const Notifications: React.FC<NotificationsProps> = ({ notifications }) => {
    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map((note, idx) => (
                <div key={idx} className="glass-light rounded-lg px-4 py-2 animate-slide-in flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm">{note}</span>
                </div>
            ))}
        </div>
    );
};

export default Notifications;
