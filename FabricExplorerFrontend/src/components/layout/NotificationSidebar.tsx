import { useEffect } from "react";
import { NotificationList } from "../ui/NotificationList";
import { useNotifications } from "@/providers/NotificationProvider";
import type { NotificationFilter } from "@/types/notification";

interface NotificationSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const FILTERS: { value: NotificationFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
];

export function NotificationSidebar({
    collapsed,
    onToggle,
}: NotificationSidebarProps) {
    const {
        items,
        unreadCount,
        filter,
        loading,
        loadingMore,
        hasMore,
        error,
        markingAll,
        setFilter,
        refresh,
        loadMore,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    // Danh sách là lịch sử trong DB: tải lại mỗi lần mở sidebar (realtime chỉ bổ sung khi đang mở app).
    useEffect(() => {
        if (!collapsed) void refresh();
    }, [collapsed, refresh]);

    return (
        <aside
            className={`
                fixed right-0 z-50
                flex h-screen w-80 flex-col
                border-l border-gray-200 bg-white shadow-xl
                transition-transform duration-300 ease-in-out
                ${collapsed ? "translate-x-full" : "translate-x-0"}
            `}
        >
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-5">
                <h3 className="text-lg font-semibold text-gray-900">
                    Notifications
                </h3>

                <button
                    type="button"
                    onClick={onToggle}
                    className="
                        flex h-8 w-8 items-center justify-center
                        rounded-md text-gray-500
                        transition-colors
                        hover:bg-gray-100 hover:text-gray-900
                        focus:outline-none focus:ring-2 focus:ring-gray-300
                    "
                    aria-label="Close notifications"
                    title="Close"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 6l12 12M18 6L6 18"
                        />
                    </svg>
                </button>
            </div>

            {/* Actions */}
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-gray-200 px-5">
                <div className="flex items-center gap-1">
                    {FILTERS.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setFilter(value)}
                            className={`
                                rounded-md px-2 py-1 text-sm font-medium
                                transition-colors
                                ${
                                    filter === value
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-500 hover:text-gray-900"
                                }
                            `}
                        >
                            {label}
                            {value === "unread" && unreadCount > 0 && (
                                <span className="ml-1 text-xs text-indigo-600">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => void markAllAsRead()}
                    disabled={unreadCount === 0 || markingAll}
                    className="
                        text-sm font-medium text-gray-600
                        transition-colors
                        hover:text-gray-900
                        disabled:cursor-not-allowed disabled:opacity-40
                        disabled:hover:text-gray-600
                    "
                >
                    {markingAll ? "Marking..." : "Mark all as read"}
                </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto">
                <NotificationList
                    items={items}
                    filter={filter}
                    loading={loading}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    error={error}
                    onMarkAsRead={(id) => void markAsRead(id)}
                    onLoadMore={() => void loadMore()}
                    onRetry={() => void refresh()}
                />
            </div>
        </aside>
    );
}