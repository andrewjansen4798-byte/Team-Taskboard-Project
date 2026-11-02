export function logActivity({ type, member, taskTitle, newStatus }) {
    try {
        const saved =
            JSON.parse(localStorage.getItem("collabboardActivities")) || [];

        const newActivity = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type, // "created" | "updated" | "deleted" | "status"
            member: member || "Team Member",
            taskTitle,
            newStatus,
            timestamp: new Date().toISOString(),
        };

        localStorage.setItem(
            "collabboardActivities",
            JSON.stringify([newActivity, ...saved].slice(0, 50))
        );

        window.dispatchEvent(new Event("collabboardActivityUpdated"));
    } catch {
        // ignore storage errors
    }
}