
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ClipboardList,
    ListTodo,
    Clock3,
    CircleCheck,
    TriangleAlert,
    CalendarClock,
    Users,
    CheckCircle2,
    ListChecks,
} from "lucide-react";

import "./DashboardPage.css";

function DashboardPage({
    tasks = [],
    members = [],
    onOpenBoard,
}) {
    // =========================================================
    // VIEW STATES
    // =========================================================

    const [
        showAllUpcoming,
        setShowAllUpcoming,
    ] = useState(false);

    const [
        showAllActivity,
        setShowAllActivity,
    ] = useState(false);

    // =========================================================
    // DONUT HOVER STATE
    // =========================================================

    const [
        hoveredStatus,
        setHoveredStatus,
    ] = useState(null);

    // =========================================================
    // ACTIVITIES
    // =========================================================

    const [
        activities,
        setActivities,
    ] = useState(() => {
        try {
            const savedActivities =
                JSON.parse(
                    localStorage.getItem(
                        "collabboardActivities"
                    )
                ) || [];

            return [
                ...savedActivities,
            ].sort(
                (a, b) => {
                    const dateA =
                        new Date(
                            a.timestamp
                        ).getTime();

                    const dateB =
                        new Date(
                            b.timestamp
                        ).getTime();

                    return dateB - dateA;
                }
            );
        } catch {
            return [];
        }
    });

    // =========================================================
    // REFRESH ACTIVITIES
    // =========================================================

    useEffect(() => {
        const loadActivities = () => {
            try {
                const savedActivities =
                    JSON.parse(
                        localStorage.getItem(
                            "collabboardActivities"
                        )
                    ) || [];

                const sortedActivities =
                    [
                        ...savedActivities,
                    ].sort(
                        (a, b) => {
                            const dateA =
                                new Date(
                                    a.timestamp
                                ).getTime();

                            const dateB =
                                new Date(
                                    b.timestamp
                                ).getTime();

                            return dateB - dateA;
                        }
                    );

                setActivities(
                    sortedActivities
                );
            } catch {
                setActivities([]);
            }
        };

        window.addEventListener(
            "collabboardActivityUpdated",
            loadActivities
        );

        window.addEventListener(
            "storage",
            loadActivities
        );

        return () => {
            window.removeEventListener(
                "collabboardActivityUpdated",
                loadActivities
            );

            window.removeEventListener(
                "storage",
                loadActivities
            );
        };
    }, []);

    // =========================================================
    // GET TASK ASSIGNEES
    // =========================================================
    //
    // New structure:
    // assignees: ["Andrew Terence", "John Silva"]
    //
    // Older structure:
    // assignedTo: "Andrew Terence"
    //
    // Supports both formats.
    // =========================================================

    const getTaskAssignees = (task) => {
        if (!task) {
            return [];
        }

        if (
            Array.isArray(
                task.assignees
            )
        ) {
            return [
                ...new Set(
                    task.assignees.filter(
                        Boolean
                    )
                ),
            ];
        }

        if (task.assignedTo) {
            return [
                task.assignedTo,
            ];
        }

        return [];
    };

    // =========================================================
    // SHARED TEAM MEMBERS
    // =========================================================
    //
    // App.jsx is the single source of truth.
    //
    // Dashboard uses this list instead of creating its own
    // member list from task assignments.
    // =========================================================

    const teamMembers = useMemo(() => {
        if (!Array.isArray(members)) {
            return [];
        }

        return members.filter(
            (member) =>
                member &&
                member.name
        );
    }, [members]);

    // =========================================================
    // TASK COUNTS
    // =========================================================

    const totalTasks =
        tasks.length;

    const todoCount =
        tasks.filter(
            (task) =>
                task.status === "todo"
        ).length;

    const doingCount =
        tasks.filter(
            (task) =>
                task.status === "doing"
        ).length;

    const reviewCount =
        tasks.filter(
            (task) =>
                task.status === "review"
        ).length;

    const doneCount =
        tasks.filter(
            (task) =>
                task.status === "done"
        ).length;

    // =========================================================
    // COMPLETION
    // =========================================================

    const completionPercentage =
        totalTasks === 0
            ? 0
            : Math.round(
                  (
                      doneCount /
                      totalTasks
                  ) *
                      100
              );

    // =========================================================
    // TODAY
    // =========================================================

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    // =========================================================
    // OVERDUE
    // =========================================================

    const overdueTasks =
        tasks.filter(
            (task) => {
                if (
                    !task.dueDate ||
                    task.status === "done"
                ) {
                    return false;
                }

                const due =
                    new Date(
                        task.dueDate +
                            "T00:00:00"
                    );

                due.setHours(
                    0,
                    0,
                    0,
                    0
                );

                return due < today;
            }
        );

    const overdueCount =
        overdueTasks.length;

    // =========================================================
    // UPCOMING TASKS
    // =========================================================

    const upcomingTasks =
        tasks
            .filter(
                (task) => {
                    if (
                        !task.dueDate ||
                        task.status === "done"
                    ) {
                        return false;
                    }

                    const due =
                        new Date(
                            task.dueDate +
                                "T00:00:00"
                        );

                    due.setHours(
                        0,
                        0,
                        0,
                        0
                    );

                    return due >= today;
                }
            )
            .sort(
                (a, b) => {
                    const dateA =
                        new Date(
                            a.dueDate +
                                "T00:00:00"
                        ).getTime();

                    const dateB =
                        new Date(
                            b.dueDate +
                                "T00:00:00"
                        ).getTime();

                    return dateA - dateB;
                }
            );

    const displayedUpcomingTasks =
        showAllUpcoming
            ? upcomingTasks
            : upcomingTasks.slice(
                  0,
                  3
              );

    // =========================================================
    // TEAM SUMMARY
    // =========================================================
    //
    // IMPORTANT:
    // The member list comes from App.jsx.
    //
    // This guarantees that:
    // - Members with zero tasks still appear.
    // - Renamed members appear with their new name.
    // - Deleted members disappear.
    // - Each multiple-assignee task counts for every member.
    // =========================================================

    const teamSummary =
        useMemo(() => {
            return teamMembers.map(
                (member) => {
                    const memberName =
                        member.name;

                    const memberTasks =
                        tasks.filter(
                            (task) => {
                                const taskAssignees =
                                    getTaskAssignees(
                                        task
                                    );

                                return taskAssignees.includes(
                                    memberName
                                );
                            }
                        );

                    const completed =
                        memberTasks.filter(
                            (task) =>
                                task.status ===
                                "done"
                        ).length;

                    const inProgress =
                        memberTasks.filter(
                            (task) =>
                                task.status ===
                                "doing"
                        ).length;

                    const todo =
                        memberTasks.filter(
                            (task) =>
                                task.status ===
                                "todo"
                        ).length;

                    const review =
                        memberTasks.filter(
                            (task) =>
                                task.status ===
                                "review"
                        ).length;

                    const total =
                        memberTasks.length;

                    const percentage =
                        total === 0
                            ? 0
                            : Math.round(
                                  (
                                      completed /
                                      total
                                  ) *
                                      100
                              );

                    return {
                        id:
                            member.id ||
                            memberName,
                        name:
                            memberName,
                        email:
                            member.email ||
                            "",
                        projectRole:
                            member.projectRole ||
                            member.role ||
                            "",
                        total,
                        completed,
                        inProgress,
                        todo,
                        review,
                        percentage,
                    };
                }
            );
        }, [
            teamMembers,
            tasks,
        ]);

    // =========================================================
    // DEADLINE TEXT
    // =========================================================

    const getDaysRemaining =
        (date) => {
            const due =
                new Date(
                    date +
                        "T00:00:00"
                );

            due.setHours(
                0,
                0,
                0,
                0
            );

            return Math.ceil(
                (
                    due -
                    today
                ) /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
            );
        };

    const getDeadlineLabel =
        (date) => {
            const days =
                getDaysRemaining(
                    date
                );

            if (
                days === 0
            ) {
                return "Due today";
            }

            if (
                days === 1
            ) {
                return "Tomorrow";
            }

            if (
                days < 7
            ) {
                return `In ${days} days`;
            }

            return new Date(
                date +
                    "T00:00:00"
            ).toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric",
                }
            );
        };

    const getDeadlineClass =
        (date) => {
            const days =
                getDaysRemaining(
                    date
                );

            if (
                days === 0
            ) {
                return "deadline-today";
            }

            if (
                days <= 2
            ) {
                return "deadline-soon";
            }

            return "deadline-normal";
        };

    // =========================================================
    // UPCOMING TASK ASSIGNEE DISPLAY
    // =========================================================

    const getUpcomingAssigneeText =
        (task) => {
            const assignees =
                getTaskAssignees(
                    task
                );

            if (
                assignees.length === 0
            ) {
                return "Team Member";
            }

            if (
                assignees.length === 1
            ) {
                return assignees[0];
            }

            if (
                assignees.length === 2
            ) {
                return assignees.join(
                    ", "
                );
            }

            return `${assignees[0]}, ${assignees[1]} +${
                assignees.length - 2
            }`;
        };

    // =========================================================
    // ACTIVITY TEXT
    // =========================================================

    const getActivityText =
        (activity) => {
            const title =
                activity.taskTitle ||
                "a task";

            if (
                activity.type ===
                "created"
            ) {
                return (
                    <>
                        {" created "}
                        <strong>
                            "{title}"
                        </strong>
                    </>
                );
            }

            if (
                activity.type ===
                "updated"
            ) {
                return (
                    <>
                        {" updated "}
                        <strong>
                            "{title}"
                        </strong>
                    </>
                );
            }

            if (
                activity.type ===
                "deleted"
            ) {
                return (
                    <>
                        {" deleted "}
                        <strong>
                            "{title}"
                        </strong>
                    </>
                );
            }

            if (
                activity.type ===
                "status"
            ) {
                if (
                    activity.newStatus ===
                    "done"
                ) {
                    return (
                        <>
                            {" completed "}
                            <strong>
                                "{title}"
                            </strong>
                        </>
                    );
                }

                return (
                    <>
                        {" updated "}
                        <strong>
                            "{title}"
                        </strong>
                    </>
                );
            }

            return (
                <>
                    {" updated the project"}
                </>
            );
        };

    // =========================================================
    // ACTIVITY TIME
    // =========================================================

    const getActivityTime =
        (timestamp) => {
            if (!timestamp) {
                return "";
            }

            const difference =
                Date.now() -
                new Date(
                    timestamp
                ).getTime();

            const seconds =
                Math.floor(
                    difference /
                        1000
                );

            const minutes =
                Math.floor(
                    seconds /
                        60
                );

            const hours =
                Math.floor(
                    minutes /
                        60
                );

            const days =
                Math.floor(
                    hours /
                        24
                );

            if (
                seconds < 60
            ) {
                return "Just now";
            }

            if (
                minutes < 60
            ) {
                return `${minutes}m ago`;
            }

            if (
                hours < 24
            ) {
                return `${hours}h ago`;
            }

            if (
                days < 7
            ) {
                return `${days}d ago`;
            }

            return new Date(
                timestamp
            ).toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric",
                }
            );
        };

    // =========================================================
    // INITIALS
    // =========================================================

    const getInitials =
        (name) => {
            if (!name) {
                return "TM";
            }

            return name
                .split(" ")
                .filter(Boolean)
                .map(
                    (word) =>
                        word[0]
                )
                .join("")
                .slice(
                    0,
                    2
                )
                .toUpperCase();
        };

    // =========================================================
    // DONUT
    // =========================================================

    const radius =
        78;

    const circumference =
        2 *
        Math.PI *
        radius;

    const statusTotal =
        totalTasks;

    const getPercentage =
        (count) =>
            statusTotal === 0
                ? 0
                : Math.round(
                      (
                          count /
                          statusTotal
                      ) *
                          100
                  );

    const donePercentage =
        getPercentage(
            doneCount
        );

    const doingPercentage =
        getPercentage(
            doingCount
        );

    const todoPercentage =
        getPercentage(
            todoCount
        );

    const reviewPercentage =
        getPercentage(
            reviewCount
        );

    const getDashLength =
        (count) =>
            statusTotal === 0
                ? 0
                : (
                      count /
                      statusTotal
                  ) *
                  circumference;

    const doneLength =
        getDashLength(
            doneCount
        );

    const doingLength =
        getDashLength(
            doingCount
        );

    const todoLength =
        getDashLength(
            todoCount
        );

    const reviewLength =
        getDashLength(
            reviewCount
        );

    // =========================================================
    // STATUS HELPERS
    // =========================================================

    const getDonutClass =
        (status) => {
            if (
                hoveredStatus ===
                status
            ) {
                return "dashboard-donut-active";
            }

            if (
                hoveredStatus
            ) {
                return "dashboard-donut-inactive";
            }

            return "";
        };

    const handleStatusEnter =
        (status) => {
            setHoveredStatus(
                status
            );
        };

    const handleStatusLeave =
        () => {
            setHoveredStatus(
                null
            );
        };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="dashboard-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="dashboard-header">

                <div>

                    <p className="dashboard-label">
                        TEAM WORKSPACE
                    </p>

                    <h1>
                        Welcome to CollabBoard
                    </h1>

                    <p className="dashboard-subtitle">
                        Manage your team's work
                        and track progress.
                    </p>

                </div>

                <button
                    type="button"
                    className="dashboard-board-button"
                    onClick={onOpenBoard}
                >
                    Open Board →
                </button>

            </div>

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="dashboard-statistics">

                <div className="dashboard-stat-card">

                    <div className="dashboard-stat-icon dashboard-stat-icon-blue">

                        <ClipboardList
                            size={23}
                            strokeWidth={1.8}
                        />

                    </div>

                    <div className="dashboard-stat-content">

                        <span className="dashboard-stat-title">
                            Total Tasks
                        </span>

                        <strong className="dashboard-stat-number">
                            {totalTasks}
                        </strong>

                        <span className="dashboard-stat-description">
                            All tasks in workspace
                        </span>

                    </div>

                </div>

                <div className="dashboard-stat-card">

                    <div className="dashboard-stat-icon dashboard-stat-icon-purple">

                        <ListTodo
                            size={23}
                            strokeWidth={1.8}
                        />

                    </div>

                    <div className="dashboard-stat-content">

                        <span className="dashboard-stat-title">
                            To Do
                        </span>

                        <strong className="dashboard-stat-number">
                            {todoCount}
                        </strong>

                        <span className="dashboard-stat-description">
                            Tasks to get started
                        </span>

                    </div>

                </div>

                <div className="dashboard-stat-card">

                    <div className="dashboard-stat-icon dashboard-stat-icon-orange">

                        <Clock3
                            size={23}
                            strokeWidth={1.8}
                        />

                    </div>

                    <div className="dashboard-stat-content">

                        <span className="dashboard-stat-title">
                            In Progress
                        </span>

                        <strong className="dashboard-stat-number">
                            {doingCount}
                        </strong>

                        <span className="dashboard-stat-description">
                            Tasks in progress
                        </span>

                    </div>

                </div>

                <div className="dashboard-stat-card">

                    <div className="dashboard-stat-icon dashboard-stat-icon-green">

                        <CircleCheck
                            size={23}
                            strokeWidth={1.8}
                        />

                    </div>

                    <div className="dashboard-stat-content">

                        <span className="dashboard-stat-title">
                            Done
                        </span>

                        <strong className="dashboard-stat-number">
                            {doneCount}
                        </strong>

                        <span className="dashboard-stat-description">
                            Tasks completed
                        </span>

                    </div>

                </div>

                <div className="dashboard-stat-card dashboard-stat-card-overdue">

                    <div className="dashboard-stat-icon dashboard-stat-icon-red">

                        <TriangleAlert
                            size={23}
                            strokeWidth={1.8}
                        />

                    </div>

                    <div className="dashboard-stat-content">

                        <span className="dashboard-stat-title">
                            Overdue
                        </span>

                        <strong className="dashboard-stat-number">
                            {overdueCount}
                        </strong>

                        <span className="dashboard-stat-description">
                            Tasks past due date
                        </span>

                    </div>

                </div>

            </div>

            {/* =================================================
                STATUS + UPCOMING
            ================================================= */}

            <div className="dashboard-main-grid">

                {/* =================================================
                    STATUS OVERVIEW
                ================================================= */}

                <section className="dashboard-card dashboard-status-card">

                    <div className="dashboard-card-header">

                        <div>

                            <span className="dashboard-card-label">
                                TASK STATUS
                            </span>

                            <h2>
                                Status Overview
                            </h2>

                            <p>
                                Get a snapshot of the status of your tasks.
                            </p>

                        </div>

                    </div>

                    <div className="dashboard-status-overview">

                        {/* =================================================
                            DONUT
                        ================================================= */}

                        <div className="dashboard-donut-wrapper">

                            <svg
                                className="dashboard-donut"
                                width="225"
                                height="225"
                                viewBox="0 0 200 200"
                            >

                                {/* BACKGROUND */}

                                <circle
                                    cx="100"
                                    cy="100"
                                    r={radius}
                                    fill="none"
                                    stroke="#eef0f4"
                                    strokeWidth="25"
                                />

                                {/* =================================================
                                    DONE
                                ================================================= */}

                                {doneCount > 0 && (
                                    <circle
                                        className={`
                                            dashboard-donut-segment
                                            dashboard-donut-done
                                            ${getDonutClass("done")}
                                        `}
                                        cx="100"
                                        cy="100"
                                        r={radius}
                                        fill="none"
                                        strokeWidth="25"
                                        strokeDasharray={`${doneLength} ${circumference}`}
                                        strokeDashoffset="0"
                                        onMouseEnter={() =>
                                            handleStatusEnter(
                                                "done"
                                            )
                                        }
                                        onMouseLeave={
                                            handleStatusLeave
                                        }
                                    />
                                )}

                                {/* =================================================
                                    IN PROGRESS
                                ================================================= */}

                                {doingCount > 0 && (
                                    <circle
                                        className={`
                                            dashboard-donut-segment
                                            dashboard-donut-doing
                                            ${getDonutClass("doing")}
                                        `}
                                        cx="100"
                                        cy="100"
                                        r={radius}
                                        fill="none"
                                        strokeWidth="25"
                                        strokeDasharray={`${doingLength} ${circumference}`}
                                        strokeDashoffset={
                                            -doneLength
                                        }
                                        onMouseEnter={() =>
                                            handleStatusEnter(
                                                "doing"
                                            )
                                        }
                                        onMouseLeave={
                                            handleStatusLeave
                                        }
                                    />
                                )}

                                {/* =================================================
                                    TO DO
                                ================================================= */}

                                {todoCount > 0 && (
                                    <circle
                                        className={`
                                            dashboard-donut-segment
                                            dashboard-donut-todo
                                            ${getDonutClass("todo")}
                                        `}
                                        cx="100"
                                        cy="100"
                                        r={radius}
                                        fill="none"
                                        strokeWidth="25"
                                        strokeDasharray={`${todoLength} ${circumference}`}
                                        strokeDashoffset={
                                            -(
                                                doneLength +
                                                doingLength
                                            )
                                        }
                                        onMouseEnter={() =>
                                            handleStatusEnter(
                                                "todo"
                                            )
                                        }
                                        onMouseLeave={
                                            handleStatusLeave
                                        }
                                    />
                                )}

                                {/* =================================================
                                    IN REVIEW
                                ================================================= */}

                                {reviewCount > 0 && (
                                    <circle
                                        className={`
                                            dashboard-donut-segment
                                            dashboard-donut-review
                                            ${getDonutClass("review")}
                                        `}
                                        cx="100"
                                        cy="100"
                                        r={radius}
                                        fill="none"
                                        strokeWidth="25"
                                        strokeDasharray={`${reviewLength} ${circumference}`}
                                        strokeDashoffset={
                                            -(
                                                doneLength +
                                                doingLength +
                                                todoLength
                                            )
                                        }
                                        onMouseEnter={() =>
                                            handleStatusEnter(
                                                "review"
                                            )
                                        }
                                        onMouseLeave={
                                            handleStatusLeave
                                        }
                                    />
                                )}

                            </svg>

                            {/* =================================================
                                CENTER TEXT
                            ================================================= */}

                            <div className="dashboard-donut-center">

                                <strong>
                                    {totalTasks}
                                </strong>

                                <span>
                                    Total Tasks
                                </span>

                            </div>

                            {/* =================================================
                                SMALL TOOLTIP
                            ================================================= */}

                            {hoveredStatus && (
                                <div className="dashboard-donut-tooltip">

                                    <span
                                        className={`
                                            dashboard-tooltip-dot
                                            dashboard-tooltip-dot-${hoveredStatus}
                                        `}
                                    />

                                    <span className="dashboard-tooltip-name">

                                        {hoveredStatus === "done" &&
                                            "Done"}

                                        {hoveredStatus === "doing" &&
                                            "In Progress"}

                                        {hoveredStatus === "todo" &&
                                            "To Do"}

                                        {hoveredStatus === "review" &&
                                            "In Review"}

                                    </span>

                                    <strong>

                                        {hoveredStatus === "done" &&
                                            doneCount}

                                        {hoveredStatus === "doing" &&
                                            doingCount}

                                        {hoveredStatus === "todo" &&
                                            todoCount}

                                        {hoveredStatus === "review" &&
                                            reviewCount}

                                    </strong>

                                </div>
                            )}

                        </div>

                        {/* =================================================
                            LEGEND
                        ================================================= */}

                        <div className="dashboard-status-legend">

                            {/* DONE */}

                            <div
                                className={`
                                    dashboard-status-legend-item
                                    ${
                                        hoveredStatus ===
                                        "done"
                                            ? "dashboard-status-legend-active"
                                            : ""
                                    }
                                `}
                                onMouseEnter={() =>
                                    handleStatusEnter(
                                        "done"
                                    )
                                }
                                onMouseLeave={
                                    handleStatusLeave
                                }
                            >

                                <div className="dashboard-status-name">

                                    <span className="dashboard-status-dot dashboard-dot-done" />

                                    <span>
                                        Done
                                    </span>

                                </div>

                                <strong>
                                    {doneCount}
                                </strong>

                                <small>
                                    {donePercentage}%
                                </small>

                            </div>

                            {/* IN PROGRESS */}

                            <div
                                className={`
                                    dashboard-status-legend-item
                                    ${
                                        hoveredStatus ===
                                        "doing"
                                            ? "dashboard-status-legend-active"
                                            : ""
                                    }
                                `}
                                onMouseEnter={() =>
                                    handleStatusEnter(
                                        "doing"
                                    )
                                }
                                onMouseLeave={
                                    handleStatusLeave
                                }
                            >

                                <div className="dashboard-status-name">

                                    <span className="dashboard-status-dot dashboard-dot-doing" />

                                    <span>
                                        In Progress
                                    </span>

                                </div>

                                <strong>
                                    {doingCount}
                                </strong>

                                <small>
                                    {doingPercentage}%
                                </small>

                            </div>

                            {/* TO DO */}

                            <div
                                className={`
                                    dashboard-status-legend-item
                                    ${
                                        hoveredStatus ===
                                        "todo"
                                            ? "dashboard-status-legend-active"
                                            : ""
                                    }
                                `}
                                onMouseEnter={() =>
                                    handleStatusEnter(
                                        "todo"
                                    )
                                }
                                onMouseLeave={
                                    handleStatusLeave
                                }
                            >

                                <div className="dashboard-status-name">

                                    <span className="dashboard-status-dot dashboard-dot-todo" />

                                    <span>
                                        To Do
                                    </span>

                                </div>

                                <strong>
                                    {todoCount}
                                </strong>

                                <small>
                                    {todoPercentage}%
                                </small>

                            </div>

                            {/* IN REVIEW */}

                            <div
                                className={`
                                    dashboard-status-legend-item
                                    ${
                                        hoveredStatus ===
                                        "review"
                                            ? "dashboard-status-legend-active"
                                            : ""
                                    }
                                `}
                                onMouseEnter={() =>
                                    handleStatusEnter(
                                        "review"
                                    )
                                }
                                onMouseLeave={
                                    handleStatusLeave
                                }
                            >

                                <div className="dashboard-status-name">

                                    <span className="dashboard-status-dot dashboard-dot-review" />

                                    <span>
                                        In Review
                                    </span>

                                </div>

                                <strong>
                                    {reviewCount}
                                </strong>

                                <small>
                                    {reviewPercentage}%
                                </small>

                            </div>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    UPCOMING DUE TASKS
                ================================================= */}

                <section className="dashboard-card dashboard-upcoming-card">

                    <div className="dashboard-card-header">

                        <div>

                            <span className="dashboard-card-label">
                                DEADLINES
                            </span>

                            <h2>
                                Upcoming Due Tasks
                            </h2>

                        </div>

                        {upcomingTasks.length > 3 && (
                            <button
                                type="button"
                                className="dashboard-view-all"
                                onClick={() =>
                                    setShowAllUpcoming(
                                        (previous) =>
                                            !previous
                                    )
                                }
                            >
                                {showAllUpcoming
                                    ? "Show less"
                                    : "View more"}
                            </button>
                        )}

                    </div>

                    <div className="dashboard-upcoming-list">

                        {upcomingTasks.length === 0 ? (
                            <div className="dashboard-empty-message">

                                <CalendarClock
                                    size={22}
                                    strokeWidth={1.7}
                                />

                                <span>
                                    No upcoming due tasks
                                </span>

                            </div>
                        ) : (
                            displayedUpcomingTasks.map(
                                (task) => (
                                    <div
                                        className="dashboard-upcoming-item"
                                        key={
                                            task.id
                                        }
                                    >

                                        <div className="dashboard-upcoming-icon">

                                            <CalendarClock
                                                size={17}
                                                strokeWidth={1.8}
                                            />

                                        </div>

                                        <div className="dashboard-upcoming-info">

                                            <strong>
                                                {
                                                    task.title
                                                }
                                            </strong>

                                            <span>
                                                {getUpcomingAssigneeText(
                                                    task
                                                )}
                                            </span>

                                        </div>

                                        <div className="dashboard-upcoming-date">

                                            <span
                                                className={getDeadlineClass(
                                                    task.dueDate
                                                )}
                                            >
                                                {getDeadlineLabel(
                                                    task.dueDate
                                                )}
                                            </span>

                                        </div>

                                    </div>
                                )
                            )
                        )}

                    </div>

                </section>

            </div>

            {/* =================================================
                SECOND ROW
            ================================================= */}

            <div className="dashboard-secondary-grid">

                {/* TASK COMPLETION */}

                <section className="dashboard-card dashboard-completion-card">

                    <div className="dashboard-completion-header">

                        <div>

                            <span className="dashboard-card-label">
                                PROJECT PROGRESS
                            </span>

                            <h2>
                                Task Completion
                            </h2>

                        </div>

                        <strong className="dashboard-completion-percentage">
                            {completionPercentage}%
                        </strong>

                    </div>

                    <div className="dashboard-completion-bar">

                        <div
                            className="dashboard-completion-fill"
                            style={{
                                width:
                                    `${completionPercentage}%`,
                            }}
                        />

                    </div>

                </section>

                {/* TEAM TASK SUMMARY */}

                <section className="dashboard-card dashboard-team-summary-card">

                    <div className="dashboard-card-header">

                        <div>

                            <span className="dashboard-card-label">
                                TEAM WORKSPACE
                            </span>

                            <h2>
                                Team Task Summary
                            </h2>

                        </div>

                    </div>

                    <div className="dashboard-team-summary-content">

                        <div className="dashboard-team-summary-stat">

                            <span className="dashboard-team-summary-icon dashboard-summary-purple">

                                <Users
                                    size={17}
                                    strokeWidth={1.8}
                                />

                            </span>

                            <div>

                                <strong>
                                    {
                                        teamMembers.length
                                    }
                                </strong>

                                <span>
                                    Active Members
                                </span>

                            </div>

                        </div>

                        <div className="dashboard-team-summary-stat">

                            <span className="dashboard-team-summary-icon dashboard-summary-blue">

                                <ListChecks
                                    size={17}
                                    strokeWidth={1.8}
                                />

                            </span>

                            <div>

                                <strong>
                                    {totalTasks}
                                </strong>

                                <span>
                                    Total Tasks
                                </span>

                            </div>

                        </div>

                        <div className="dashboard-team-summary-stat">

                            <span className="dashboard-team-summary-icon dashboard-summary-green">

                                <CheckCircle2
                                    size={17}
                                    strokeWidth={1.8}
                                />

                            </span>

                            <div>

                                <strong>
                                    {doneCount}
                                </strong>

                                <span>
                                    Completed
                                </span>

                            </div>

                        </div>

                        <div className="dashboard-team-summary-stat">

                            <span className="dashboard-team-summary-icon dashboard-summary-orange">

                                <Clock3
                                    size={17}
                                    strokeWidth={1.8}
                                />

                            </span>

                            <div>

                                <strong>
                                    {doingCount}
                                </strong>

                                <span>
                                    In Progress
                                </span>

                            </div>

                        </div>

                    </div>

                </section>

            </div>

            {/* =================================================
                TEAM ACTIVITY
            ================================================= */}

            <section className="dashboard-card dashboard-activity-card">

                <div className="dashboard-card-header">

                    <div>

                        <span className="dashboard-card-label">
                            RECENT UPDATES
                        </span>

                        <h2>
                            Team Activity
                        </h2>

                    </div>

                    {activities.length > 3 && (
                        <button
                            type="button"
                            className="dashboard-view-all"
                            onClick={() =>
                                setShowAllActivity(
                                    (previous) =>
                                        !previous
                                )
                            }
                        >
                            {showAllActivity
                                ? "Show less"
                                : "View more"}
                        </button>
                    )}

                </div>

                <div className="dashboard-activity-list">

                    {activities.length === 0 ? (
                        <div className="dashboard-empty-message">
                            No recent activity yet.
                        </div>
                    ) : (
                        (
                            showAllActivity
                                ? activities
                                : activities.slice(
                                      0,
                                      3
                                  )
                        ).map(
                            (activity) => (
                                <div
                                    className="dashboard-activity-item"
                                    key={
                                        activity.id
                                    }
                                >

                                    <div className="dashboard-activity-avatar">

                                        {getInitials(
                                            activity.member ||
                                                "Team Member"
                                        )}

                                    </div>

                                    <div className="dashboard-activity-info">

                                        <strong>
                                            {
                                                activity.member ||
                                                "Team Member"
                                            }
                                        </strong>

                                        <span>
                                            {getActivityText(
                                                activity
                                            )}
                                        </span>

                                    </div>

                                    <small>
                                        {getActivityTime(
                                            activity.timestamp
                                        )}
                                    </small>

                                </div>
                            )
                        )
                    )}

                </div>

            </section>

            {/* =================================================
                TEAM PERFORMANCE
            ================================================= */}

            {teamSummary.length > 0 && (
                <section className="dashboard-card dashboard-team-performance-card">

                    <div className="dashboard-card-header">

                        <div>

                            <span className="dashboard-card-label">
                                TEAM PERFORMANCE
                            </span>

                            <h2>
                                Member Task Progress
                            </h2>

                        </div>

                    </div>

                    <div className="dashboard-team-performance-list">

                        {teamSummary.map(
                            (member) => (
                                <div
                                    className="dashboard-team-performance-item"
                                    key={
                                        member.id
                                    }
                                >

                                    <div className="dashboard-team-member-info">

                                        <div className="dashboard-team-avatar">

                                            {getInitials(
                                                member.name
                                            )}

                                        </div>

                                        <div>

                                            <strong>
                                                {
                                                    member.name
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    member.completed
                                                }{" "}
                                                of{" "}
                                                {
                                                    member.total
                                                }{" "}
                                                tasks completed
                                            </span>

                                        </div>

                                    </div>

                                    <div className="dashboard-team-progress">

                                        <div className="dashboard-team-progress-bar">

                                            <div
                                                style={{
                                                    width:
                                                        `${member.percentage}%`,
                                                }}
                                            />

                                        </div>

                                        <strong>
                                            {
                                                member.percentage
                                            }%
                                        </strong>

                                    </div>

                                </div>
                            )
                        )}

                    </div>

                </section>
            )}

        </div>
    );
}

export default DashboardPage;