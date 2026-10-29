import { NotificationCard } from "./NotificationCard";
import type { Notification, NotificationFilter } from "@/types/notification";

interface NotificationListProps {
    items: Notification[];
    filter: NotificationFilter;
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    error: boolean;
    onMarkAsRead: (id: string) => void;
    onRemove: (id: string) => void;
    onLoadMore: () => void;
    onRetry: () => void;
}

function Spinner({ label }: { label: string }) {
    return (
        <div className="flex items-center justify-center gap-3 px-5 py-6 text-sm text-gray-500">
            <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
            </svg>
            {label}
        </div>
    );
}

export function NotificationList({
    items,
    filter,
    loading,
    loadingMore,
    hasMore,
    error,
    onMarkAsRead,
    onRemove,
    onLoadMore,
    onRetry,
}: NotificationListProps) {
    if (loading) {
        return <Spinner label="Loading notifications..." />;
    }

    if (items.length === 0 && error) {
        return (
            <div className="flex h-full items-center justify-center px-5 py-10">
                <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                        Could not load notifications
                    </p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex h-full items-center justify-center px-5 py-10">
                <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                        {filter === "unread" ? "No unread notifications" : "No notifications"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                        You&apos;re all caught up.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {items.map((notification) => (
                <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onRemove={onRemove}
                />
            ))}

            {loadingMore && <Spinner label="Loading more..." />}

            {hasMore && !loadingMore && (
                <button
                    type="button"
                    onClick={onLoadMore}
                    className="px-5 py-3 text-sm font-medium text-indigo-600 transition-colors hover:bg-gray-50 hover:text-indigo-800"
                >
                    Load more
                </button>
            )}
        </div>
    );
}
