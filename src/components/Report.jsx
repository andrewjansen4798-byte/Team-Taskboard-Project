import React, {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BarChart3,
  Download,
  ChevronDown,
  ShieldCheck,
  Flame,
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import "./Report.css";

function Reports({
  tasks = [],
  members = [],
}) {
  // =========================================================
  // FILTER STATE
  // =========================================================

  const [dateRange, setDateRange] =
    useState("last-30");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [isExporting, setIsExporting] =
    useState(false);

  // =========================================================
  // REPORT REF
  // =========================================================

  const reportRef = useRef(null);

  // =========================================================
  // GET TASK ASSIGNEES
  // =========================================================

  function getTaskAssignees(task) {
    if (!task) {
      return [];
    }

    if (Array.isArray(task.assignees)) {
      return [
        ...new Set(
          task.assignees.filter(Boolean)
        ),
      ];
    }

    if (task.assignedTo) {
      return [task.assignedTo];
    }

    return [];
  }

  // =========================================================
  // TODAY
  // =========================================================

  const todayString = useMemo(() => {
    const today = new Date();

    return (
      today.getFullYear() +
      "-" +
      String(
        today.getMonth() + 1
      ).padStart(2, "0") +
      "-" +
      String(
        today.getDate()
      ).padStart(2, "0")
    );
  }, []);

  // =========================================================
  // FILTER TASKS BY STATUS
  // =========================================================

  const filteredTasks = useMemo(() => {
    if (statusFilter === "all") {
      return tasks;
    }

    return tasks.filter(
      (task) =>
        task.status === statusFilter
    );
  }, [
    tasks,
    statusFilter,
  ]);

  // =========================================================
  // BASIC TASK COUNTS
  // =========================================================

  const totalTasks =
    filteredTasks.length;

  const completedTasks =
    filteredTasks.filter(
      (task) =>
        task.status === "done"
    ).length;

  const remainingTasks =
    Math.max(
      totalTasks -
        completedTasks,
      0
    );

  const completionRate =
    totalTasks === 0
      ? 0
      : Math.round(
          (
            completedTasks /
            totalTasks
          ) * 100
        );

  // =========================================================
  // OVERDUE TASKS
  // =========================================================

  const overdueTasks =
    filteredTasks.filter(
      (task) => {
        if (
          !task.dueDate ||
          task.status === "done"
        ) {
          return false;
        }

        return (
          task.dueDate <
          todayString
        );
      }
    );

  // =========================================================
  // HIGH PRIORITY TASKS
  // =========================================================

  const highPriorityTasks =
    filteredTasks.filter(
      (task) =>
        task.priority === "High"
    );

  const completedHighPriorityTasks =
    highPriorityTasks.filter(
      (task) =>
        task.status === "done"
    );

  const highPriorityResolved =
    highPriorityTasks.length === 0
      ? 0
      : Math.round(
          (
            completedHighPriorityTasks.length /
            highPriorityTasks.length
          ) * 100
        );

  // =========================================================
  // ON-TIME DELIVERY
  // =========================================================

  const tasksWithDeadlines =
    filteredTasks.filter(
      (task) =>
        task.dueDate
    );

  const completedWithDeadline =
    tasksWithDeadlines.filter(
      (task) =>
        task.status === "done"
    );

  function isCompletedOnTime(task) {
    if (
      !task ||
      !task.dueDate ||
      task.status !== "done"
    ) {
      return false;
    }

    if (!task.completedAt) {
      return true;
    }

    const completedDate =
      new Date(
        task.completedAt
      );

    if (
      Number.isNaN(
        completedDate.getTime()
      )
    ) {
      return true;
    }

    const dueDate =
      new Date(
        `${task.dueDate}T23:59:59`
      );

    if (
      Number.isNaN(
        dueDate.getTime()
      )
    ) {
      return true;
    }

    return (
      completedDate <=
      dueDate
    );
  }

  const onTimeCompleted =
    completedWithDeadline.filter(
      (task) =>
        isCompletedOnTime(task)
    );

  const onTimeDeliveryTotal =
    completedWithDeadline.length +
    overdueTasks.length;

  const onTimeDeliveryRate =
    onTimeDeliveryTotal === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (
                onTimeCompleted.length /
                onTimeDeliveryTotal
              ) * 100
            )
          )
        );

  // =========================================================
  // TEAM WORKLOAD
  // =========================================================

  const teamWorkload =
    useMemo(() => {
      return members
        .filter(
          (member) =>
            member &&
            member.name
        )
        .map(
          (member) => {
            const memberTasks =
              filteredTasks.filter(
                (task) => {
                  const assignees =
                    getTaskAssignees(
                      task
                    );

                  return assignees.includes(
                    member.name
                  );
                }
              );

            const assigned =
              memberTasks.length;

            const completed =
              memberTasks.filter(
                (task) =>
                  task.status ===
                  "done"
              ).length;

            const overdue =
              memberTasks.filter(
                (task) => {
                  if (
                    !task.dueDate ||
                    task.status ===
                      "done"
                  ) {
                    return false;
                  }

                  return (
                    task.dueDate <
                    todayString
                  );
                }
              ).length;

            const efficiency =
              assigned === 0
                ? 0
                : Math.round(
                    (
                      completed /
                      assigned
                    ) * 100
                  );

            let workload =
              "Low";

            if (
              assigned >= 6 ||
              overdue >= 2
            ) {
              workload =
                "High";
            } else if (
              assigned >= 3 ||
              overdue >= 1
            ) {
              workload =
                "Medium";
            }

            return {
              id:
                member.id ||
                member.name,

              name:
                member.name,

              role:
                member.projectRole ||
                member.role ||
                "Member",

              assigned,

              completed,

              overdue,

              workload,

              efficiency,
            };
          }
        );
    }, [
      members,
      filteredTasks,
      todayString,
    ]);

  // =========================================================
  // REPORT SUMMARY
  // =========================================================

  const plannedTasks =
    totalTasks;

  const reportCompleted =
    completedTasks;

  const reportRemaining =
    remainingTasks;

  const reportCompletionRate =
    completionRate;

  // =========================================================
  // SIMPLE CHART DATA
  // =========================================================

  const chartData = useMemo(() => {
    const total =
      plannedTasks;

    const completed =
      reportCompleted;

    if (total === 0) {
      return [
        {
          label: "Week 1",
          planned: 0,
          completed: 0,
        },
        {
          label: "Week 2",
          planned: 0,
          completed: 0,
        },
        {
          label: "Week 3",
          planned: 0,
          completed: 0,
        },
        {
          label: "Week 4",
          planned: 0,
          completed: 0,
        },
      ];
    }

    const plannedStep =
      Math.max(
        Math.ceil(
          total / 4
        ),
        1
      );

    const completedStep =
      Math.max(
        Math.ceil(
          completed / 4
        ),
        0
      );

    return [
      {
        label: "Week 1",
        planned: total,
        completed: Math.min(
          completed,
          completedStep
        ),
      },
      {
        label: "Week 2",
        planned: Math.max(
          total -
            plannedStep,
          0
        ),
        completed: Math.min(
          completed,
          completedStep * 2
        ),
      },
      {
        label: "Week 3",
        planned: Math.max(
          total -
            plannedStep * 2,
          0
        ),
        completed: Math.min(
          completed,
          completedStep * 3
        ),
      },
      {
        label: "Week 4",
        planned: 0,
        completed: completed,
      },
    ];
  }, [
    plannedTasks,
    reportCompleted,
  ]);

  // =========================================================
  // CHART DIMENSIONS
  // =========================================================

  const chartWidth = 700;
  const chartHeight = 240;

  const chartPaddingLeft = 44;
  const chartPaddingRight = 20;
  const chartPaddingTop = 22;
  const chartPaddingBottom = 38;

  const innerWidth =
    chartWidth -
    chartPaddingLeft -
    chartPaddingRight;

  const innerHeight =
    chartHeight -
    chartPaddingTop -
    chartPaddingBottom;

  const chartMaximum =
    Math.max(
      ...chartData.map(
        (item) =>
          Math.max(
            item.planned,
            item.completed
          )
      ),
      1
    );

  function getPointX(index) {
    if (
      chartData.length <= 1
    ) {
      return (
        chartPaddingLeft +
        innerWidth / 2
      );
    }

    return (
      chartPaddingLeft +
      (
        index /
        (
          chartData.length -
          1
        )
      ) *
        innerWidth
    );
  }

  function getPointY(value) {
    return (
      chartPaddingTop +
      innerHeight -
      (
        value /
        chartMaximum
      ) *
        innerHeight
    );
  }

  const plannedPoints =
    chartData
      .map(
        (item, index) =>
          `${getPointX(index)},${getPointY(
            item.planned
          )}`
      )
      .join(" ");

  const completedPoints =
    chartData
      .map(
        (item, index) =>
          `${getPointX(index)},${getPointY(
            item.completed
          )}`
      )
      .join(" ");

  // =========================================================
  // WORKLOAD CLASS
  // =========================================================

  function getWorkloadClass(
    workload
  ) {
    if (
      workload ===
      "High"
    ) {
      return "report-workload-high";
    }

    if (
      workload ===
      "Medium"
    ) {
      return "report-workload-medium";
    }

    return "report-workload-low";
  }

  // =========================================================
  // INITIALS
  // =========================================================

  function getInitials(name) {
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
  }

  // =========================================================
  // EXPORT PDF
  // =========================================================

  async function handleExportPDF() {
    if (
      !reportRef.current ||
      isExporting
    ) {
      return;
    }

    try {
      setIsExporting(true);

      // Wait one frame so the UI can finish rendering
      // before capturing the report.
      await new Promise(
        (resolve) =>
          requestAnimationFrame(
            resolve
          )
      );

      const canvas =
        await html2canvas(
          reportRef.current,
          {
            scale: 2,
            useCORS: true,
            backgroundColor:
              "#f7f7fb",
            logging: false,
            windowWidth:
              reportRef.current.scrollWidth,
            windowHeight:
              reportRef.current.scrollHeight,
          }
        );

      const imageData =
        canvas.toDataURL(
          "image/png",
          1.0
        );

      const pdf =
        new jsPDF({
          orientation:
            "landscape",
          unit: "mm",
          format: "a4",
          compress: true,
        });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const margin = 8;

      const availableWidth =
        pageWidth -
        margin * 2;

      const imageRatio =
        canvas.height /
        canvas.width;

      const imageHeight =
        availableWidth *
        imageRatio;

      let remainingHeight =
        imageHeight;

      let sourceY = 0;

      const pageImageHeight =
        pageHeight -
        margin * 2;

      while (
        remainingHeight >
        0
      ) {
        const currentCanvas =
          document.createElement(
            "canvas"
          );

        const scaleFactor =
          canvas.width /
          availableWidth;

        const sectionHeight =
          Math.min(
            pageImageHeight,
            remainingHeight
          );

        currentCanvas.width =
          canvas.width;

        currentCanvas.height =
          Math.round(
            sectionHeight *
            scaleFactor
          );

        const context =
          currentCanvas.getContext(
            "2d"
          );

        context.fillStyle =
          "#f7f7fb";

        context.fillRect(
          0,
          0,
          currentCanvas.width,
          currentCanvas.height
        );

        context.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          currentCanvas.height,
          0,
          0,
          currentCanvas.width,
          currentCanvas.height
        );

        const sectionImage =
          currentCanvas.toDataURL(
            "image/png",
            1.0
          );

        if (
          sourceY > 0
        ) {
          pdf.addPage();
        }

        pdf.addImage(
          sectionImage,
          "PNG",
          margin,
          margin,
          availableWidth,
          sectionHeight
        );

        sourceY +=
          currentCanvas.height;

        remainingHeight -=
          sectionHeight;
      }

      const statusLabel =
        statusFilter === "all"
          ? "All Status"
          : statusFilter ===
            "todo"
          ? "To Do"
          : statusFilter ===
            "doing"
          ? "In Progress"
          : statusFilter ===
            "review"
          ? "In Review"
          : "Done";

      const fileDate =
        new Date()
          .toISOString()
          .slice(0, 10);

      pdf.save(
        `collabboard-report-${fileDate}-${statusLabel
          .toLowerCase()
          .replace(
            /\s+/g,
            "-"
          )}.pdf`
      );
    } catch (error) {
      console.error(
        "Failed to export report PDF:",
        error
      );

      window.alert(
        "Unable to export the report as a PDF. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className="reports-page"
      ref={reportRef}
    >

      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="reports-page-header">

        <div className="reports-title-area">

          <p className="reports-page-label">
            PROJECT ANALYTICS
          </p>

          <h1>
            Project Reports
          </h1>

          <p className="reports-page-subtitle">
            Track task progress and team workload.
          </p>

        </div>

        {/* HEADER ACTIONS */}

        <div className="reports-header-actions">

          {/* DATE RANGE */}

          <div className="reports-select-wrapper">

            <CalendarDays
              size={15}
            />

            <select
              value={dateRange}
              onChange={(e) =>
                setDateRange(
                  e.target.value
                )
              }
            >
              <option value="last-7">
                Last 7 Days
              </option>

              <option value="last-30">
                Last 30 Days
              </option>

              <option value="this-month">
                This Month
              </option>

              <option value="this-sprint">
                This Sprint
              </option>
            </select>

            <ChevronDown
              size={14}
            />

          </div>

          {/* STATUS FILTER */}

          <div className="reports-select-wrapper">

            <span>
              Status
            </span>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
            >
              <option value="all">
                All Status
              </option>

              <option value="todo">
                To Do
              </option>

              <option value="doing">
                In Progress
              </option>

              <option value="review">
                In Review
              </option>

              <option value="done">
                Done
              </option>
            </select>

            <ChevronDown
              size={14}
            />

          </div>

          {/* EXPORT PDF */}

          <button
            type="button"
            className="reports-export-button"
            onClick={
              handleExportPDF
            }
            disabled={
              isExporting
            }
          >
            <Download
              size={15}
            />

            <span>
              {isExporting
                ? "Exporting..."
                : "Export PDF"}
            </span>

            <ChevronDown
              size={14}
            />

          </button>

        </div>

      </div>

      {/* ===================================================
          TOP CONTENT
      =================================================== */}

      <div className="reports-top-grid">

        {/* =================================================
            TASK PROGRESS CHART
        ================================================= */}

        <section className="reports-card reports-chart-card">

          <div className="reports-card-header">

            <div>

              <h2>
                Task Progress Overview
              </h2>

              <p>
                Progress based on the selected task status filter
              </p>

            </div>

            <div className="reports-chart-legend">

              <span>
                <i className="reports-legend-dot reports-planned-dot" />
                Planned
              </span>

              <span>
                <i className="reports-legend-dot reports-completed-dot" />
                Completed
              </span>

            </div>

          </div>

          <div className="reports-chart-wrapper">

            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="reports-chart"
              preserveAspectRatio="none"
            >

              {[0, 1, 2, 3, 4].map(
                (line) => {
                  const y =
                    chartPaddingTop +
                    (
                      line /
                      4
                    ) *
                      innerHeight;

                  return (
                    <line
                      key={
                        `grid-${line}`
                      }
                      x1={
                        chartPaddingLeft
                      }
                      x2={
                        chartWidth -
                        chartPaddingRight
                      }
                      y1={y}
                      y2={y}
                      className="reports-chart-grid-line"
                    />
                  );
                }
              )}

              <polyline
                points={
                  plannedPoints
                }
                fill="none"
                className="reports-planned-line"
              />

              <polyline
                points={
                  completedPoints
                }
                fill="none"
                className="reports-completed-line"
              />

              {chartData.map(
                (
                  item,
                  index
                ) => (
                  <circle
                    key={
                      `planned-${index}`
                    }
                    cx={getPointX(
                      index
                    )}
                    cy={getPointY(
                      item.planned
                    )}
                    r="4"
                    className="reports-planned-point"
                  />
                )
              )}

              {chartData.map(
                (
                  item,
                  index
                ) => (
                  <circle
                    key={
                      `completed-${index}`
                    }
                    cx={getPointX(
                      index
                    )}
                    cy={getPointY(
                      item.completed
                    )}
                    r="4"
                    className="reports-completed-point"
                  />
                )
              )}

              {chartData.map(
                (
                  item,
                  index
                ) => (
                  <text
                    key={
                      `label-${index}`
                    }
                    x={getPointX(
                      index
                    )}
                    y={
                      chartHeight -
                      13
                    }
                    textAnchor="middle"
                    className="reports-chart-label"
                  >
                    {
                      item.label
                    }
                  </text>
                )
              )}

            </svg>

          </div>

        </section>

        {/* =================================================
            REPORT SUMMARY
        ================================================= */}

        <section className="reports-card reports-summary-card">

          <div className="reports-card-header">

            <div>

              <h2>
                Report Summary
              </h2>

              <p>
                Based on the selected status
              </p>

            </div>

          </div>

          <div className="reports-summary-list">

            <div className="reports-summary-item">

              <div className="reports-summary-icon reports-summary-blue">

                <BarChart3
                  size={18}
                />

              </div>

              <div>

                <span>
                  Planned Tasks
                </span>

                <strong>
                  {plannedTasks}
                </strong>

              </div>

            </div>

            <div className="reports-summary-item">

              <div className="reports-summary-icon reports-summary-green">

                <CheckCircle2
                  size={18}
                />

              </div>

              <div>

                <span>
                  Completed Tasks
                </span>

                <strong>
                  {reportCompleted}
                </strong>

              </div>

            </div>

            <div className="reports-summary-item">

              <div className="reports-summary-icon reports-summary-orange">

                <Clock3
                  size={18}
                />

              </div>

              <div>

                <span>
                  Remaining Tasks
                </span>

                <strong>
                  {reportRemaining}
                </strong>

              </div>

            </div>

            <div className="reports-summary-item">

              <div className="reports-summary-icon reports-summary-purple">

                <ShieldCheck
                  size={18}
                />

              </div>

              <div>

                <span>
                  Completion Rate
                </span>

                <strong>
                  {reportCompletionRate}%
                </strong>

              </div>

            </div>

          </div>

        </section>

      </div>

      {/* ===================================================
          SMALL KPI CARDS
      =================================================== */}

      <div className="reports-kpi-grid">

        <div className="reports-kpi-card">

          <div>

            <span>
              On-Time Delivery
            </span>

            <strong>
              {onTimeDeliveryRate}%
            </strong>

            <small>
              Completed on time vs overdue work
            </small>

          </div>

          <div className="reports-kpi-icon reports-kpi-green">

            <ShieldCheck
              size={21}
            />

          </div>

        </div>

        <div className="reports-kpi-card">

          <div>

            <span>
              High-Priority Resolved
            </span>

            <strong>
              {highPriorityResolved}%
            </strong>

            <small>
              High-priority tasks completed
            </small>

          </div>

          <div className="reports-kpi-icon reports-kpi-purple">

            <Flame
              size={21}
            />

          </div>

        </div>

        <div className="reports-kpi-card">

          <div>

            <span>
              Overdue Tasks
            </span>

            <strong>
              {overdueTasks.length}
            </strong>

            <small>
              Current unfinished overdue tasks
            </small>

          </div>

          <div className="reports-kpi-icon reports-kpi-red">

            <Clock3
              size={21}
            />

          </div>

        </div>

      </div>

      {/* ===================================================
          TEAM WORKLOAD
      =================================================== */}

      <section className="reports-card reports-workload-card">

        <div className="reports-card-header">

          <div>

            <h2>
              Team Workload
            </h2>

            <p>
              Task distribution and progress by team member.
            </p>

          </div>

          <button
            type="button"
            className="reports-sort-button"
          >
            <ArrowUpDown
              size={15}
            />

            Sort

          </button>

        </div>

        <div className="reports-table-wrapper">

          <table className="reports-table">

            <thead>

              <tr>

                <th>
                  Team Member
                </th>

                <th>
                  Task Assignments
                </th>

                <th>
                  Completed
                </th>

                <th>
                  Overdue
                </th>

                <th>
                  Workload
                </th>

                <th>
                  Efficiency
                </th>

              </tr>

            </thead>

            <tbody>

              {teamWorkload.length >
              0 ? (

                teamWorkload.map(
                  (member) => (

                    <tr
                      key={
                        member.id
                      }
                    >

                      <td>

                        <div className="reports-member-cell">

                          <div className="reports-member-avatar">
                            {
                              getInitials(
                                member.name
                              )
                            }
                          </div>

                          <div>

                            <strong>
                              {
                                member.name
                              }
                            </strong>

                            <span>
                              {
                                member.role
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>
                        {
                          member.assigned
                        }
                      </td>

                      <td className="reports-completed-value">
                        {
                          member.completed
                        }
                      </td>

                      <td className="reports-overdue-value">
                        {
                          member.overdue
                        }
                      </td>

                      <td>

                        <span
                          className={`reports-workload-badge ${getWorkloadClass(
                            member.workload
                          )}`}
                        >
                          {
                            member.workload
                          }
                        </span>

                      </td>

                      <td>

                        <div className="reports-efficiency-cell">

                          <div className="reports-efficiency-bar">

                            <div
                              style={{
                                width:
                                  `${member.efficiency}%`,
                              }}
                            />

                          </div>

                          <strong>
                            {
                              member.efficiency
                            }%
                          </strong>

                        </div>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="6"
                    className="reports-empty-row"
                  >
                    No team members available.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default Reports;