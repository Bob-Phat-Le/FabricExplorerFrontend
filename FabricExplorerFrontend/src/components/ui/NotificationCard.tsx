import type { Notification } from "@/types/notification";

interface NotificationCardProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
}

export function NotificationCard({
    notification,
    onMarkAsRead,
}: NotificationCardProps) {
    const formattedTime = new Date(
        notification.createdAt
    ).toLocaleString();

    const failed = notification.type.endsWith(".failed");

    return (
        <div
            className={`
                border-b border-gray-200 px-5 py-4
                transition-colors
                ${notification.isRead ? "hover:bg-gray-50" : "bg-indigo-50/50 hover:bg-indigo-50"}
            `}
        >
            {/* Title */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                    {!notification.isRead && (
                        <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${failed ? "bg-rose-500" : "bg-indigo-600"}`}
                            aria-label="Unread"
                        />
                    )}
                    <h4
                        className={`min-w-0 flex-1 text-sm ${
                            notification.isRead
                                ? "font-medium text-gray-600"
                                : "font-semibold text-gray-900"
                        }`}
                    >
                        {notification.title}
                    </h4>
                </div>

                {!notification.isRead && (
                    <button
                        type="button"
                        onClick={() => onMarkAsRead(notification.id)}
                        className="
                            flex h-6 w-6 shrink-0 items-center justify-center
                            rounded text-gray-400
                            transition-colors
                            hover:bg-gray-200 hover:text-gray-700
                            focus:outline-none focus:ring-2 focus:ring-gray-300
                        "
                        aria-label="Mark as read"
                        title="Mark as read"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-4 w-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Message */}
            {notification.message && (
                <p
                    className={`mt-2 text-sm leading-5 ${
                        notification.isRead ? "text-gray-500" : "text-gray-600"
                    }`}
                >
                    {notification.message}
                </p>
            )}

            {/* Footer */}
            <div className="mt-3 flex justify-end">
                <time
                    dateTime={notification.createdAt}
                    className="text-xs text-gray-400"
                >
                    {formattedTime}
                </time>
            </div>
        </div>
    );
}
