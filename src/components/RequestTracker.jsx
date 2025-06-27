import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  LinearProgress,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Http as HttpIcon,
  Send as SendIcon,
  GetApp as GetAppIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { httpInterceptor } from "../services/HTTPInterceptor";
import { traceService } from "../services/FirebaseTraceService";

const RequestTracker = () => {
  const [traces, setTraces] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [methodStats, setMethodStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(2);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    method: "",
  });
  const [realTimeMode, setRealTimeMode] = useState(true);

  useEffect(() => {
    loadTraces();
    loadAnalytics();
    loadMethodStats();

    // Auto-refresh based on real-time mode
    const interval = setInterval(
      () => {
        if (realTimeMode) {
          loadTraces();
          loadAnalytics();
          loadMethodStats();
        }
      },
      realTimeMode ? 5000 : 30000
    ); // 5s for real-time, 30s for normal

    return () => clearInterval(interval);
  }, [realTimeMode]);

  const loadTraces = async () => {
    try {
      setLoading(true);
      const sessionTraces = await httpInterceptor.getSessionTraces();
      // Sort by timestamp (newest first)
      const sortedTraces = sessionTraces.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setTraces(sortedTraces);
      setError(null);
    } catch (err) {
      setError("Failed to load traces: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await httpInterceptor.getAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      // Set empty analytics to prevent UI crashes
      setAnalytics({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        requestsByStatus: {},
        requestsByType: {},
        timeline: [],
      });
    }
  };

  const loadMethodStats = async () => {
    try {
      const stats = await traceService.getMethodStatistics();
      setMethodStats(stats);
    } catch (err) {
      console.error("Failed to load method statistics:", err);
      // Set empty stats to prevent UI crashes
      setMethodStats({
        totalRequests: 0,
        byMethod: {},
        responseTimeStats: {
          average: 0,
          min: 0,
          max: 0,
        },
      });
    }
  };

  const handleRefresh = () => {
    loadTraces();
    loadAnalytics();
    loadMethodStats();
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SUCCESS":
        return "success";
      case "ERROR":
        return "error";
      case "PENDING":
        return "warning";
      default:
        return "default";
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case "GET":
        return "primary";
      case "POST":
        return "secondary";
      case "PUT":
        return "warning";
      case "DELETE":
        return "error";
      case "PATCH":
        return "info";
      default:
        return "default";
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case "GET":
        return <GetAppIcon />;
      case "POST":
        return <SendIcon />;
      default:
        return <HttpIcon />;
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return (
        date.toLocaleString() +
        "." +
        date.getMilliseconds().toString().padStart(3, "0")
      );
    } catch (error) {
      console.warn("Failed to format timestamp:", timestamp, error);
      return "Invalid Date";
    }
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const MethodAnalyticsTab = () => (
    <Grid container spacing={3}>
      {methodStats && (
        <>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              HTTP Method Statistics
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Requests by Method
                </Typography>
                {Object.entries(methodStats.byMethod).map(([method, stats]) => (
                  <Box key={method} sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Chip
                        icon={getMethodIcon(method)}
                        label={`${method} (${stats.count})`}
                        color={getMethodColor(method)}
                        sx={{ mr: 2 }}
                      />
                      <Typography variant="body2">
                        Avg: {formatDuration(stats.avgTime)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(stats.count / methodStats.totalRequests) * 100}
                      color={getMethodColor(method)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Response Time Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Average
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatDuration(methodStats.responseTimeStats.average)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Requests
                    </Typography>
                    <Typography variant="h6" color="secondary">
                      {methodStats.totalRequests}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Fastest
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatDuration(methodStats.responseTimeStats.min)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Slowest
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatDuration(methodStats.responseTimeStats.max)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent GET Requests
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                  {traces
                    .filter((trace) => trace.method === "GET")
                    .slice(0, 10)
                    .map((trace, index) => (
                      <Box
                        key={trace.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 1,
                          p: 1,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                        }}
                      >
                        <GetAppIcon color="primary" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "medium" }}
                          >
                            {trace.url}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatTimestamp(trace.timestamp)}
                          </Typography>
                        </Box>
                        <Chip
                          label={trace.status}
                          color={getStatusColor(trace.status)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {trace.responseTime && (
                          <Typography variant="caption" sx={{ minWidth: 60 }}>
                            {formatDuration(trace.responseTime)}
                          </Typography>
                        )}
                      </Box>
                    ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent POST Requests
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                  {traces
                    .filter((trace) => trace.method === "POST")
                    .slice(0, 10)
                    .map((trace, index) => (
                      <Box
                        key={trace.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 1,
                          p: 1,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                        }}
                      >
                        <SendIcon color="secondary" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "medium" }}
                          >
                            {trace.url}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatTimestamp(trace.timestamp)}
                          </Typography>
                        </Box>
                        <Chip
                          label={trace.status}
                          color={getStatusColor(trace.status)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {trace.responseTime && (
                          <Typography variant="caption" sx={{ minWidth: 60 }}>
                            {formatDuration(trace.responseTime)}
                          </Typography>
                        )}
                      </Box>
                    ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  );

  const exportTraces = () => {
    const dataStr = JSON.stringify(traces, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `traces_${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const filteredTraces = traces.filter((trace) => {
    if (filters.status && trace.status !== filters.status) return false;
    if (filters.type && trace.type !== filters.type) return false;
    if (filters.method && trace.method !== filters.method) return false;
    return true;
  });

  // Group traces by request ID to show request/response pairs
  const groupedTraces = {};
  filteredTraces.forEach((trace) => {
    if (!groupedTraces[trace.requestId]) {
      groupedTraces[trace.requestId] = [];
    }
    groupedTraces[trace.requestId].push(trace);
  });

  const TracesTab = () => (
    <Box>
      <TableContainer component={Paper} sx={{ bgcolor: "#fff" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(groupedTraces).map(([requestId, traces]) => {
              const startTrace = traces.find((t) => t.type === "REQUEST_START");
              const endTrace = traces.find(
                (t) => t.type === "REQUEST_COMPLETE"
              );
              const displayTrace = endTrace || startTrace;

              if (!displayTrace) return null;

              return (
                <TableRow
                  key={requestId}
                  sx={{
                    bgcolor: endTrace
                      ? endTrace.status === "SUCCESS"
                        ? "success.light"
                        : "error.light"
                      : "warning.light",
                    opacity: endTrace ? 1 : 0.7,
                  }}
                >
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {formatTimestamp(displayTrace.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getMethodIcon(displayTrace.method)}
                      label={displayTrace.method || "N/A"}
                      color={getMethodColor(displayTrace.method)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {displayTrace.url}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={displayTrace.status}
                      color={getStatusColor(displayTrace.status)}
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <Accordion sx={{ boxShadow: "none" }}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ minHeight: "auto", p: 0 }}
                      >
                        <Typography variant="caption">View</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 2 }}>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Request ID:
                            <Typography
                              component="span"
                              sx={{ fontFamily: "monospace", ml: 1 }}
                            >
                              {requestId}
                            </Typography>
                          </Typography>

                          {startTrace && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="primary">
                                Request Details:
                              </Typography>
                              <Typography variant="body2">
                                Started: {formatTimestamp(startTrace.timestamp)}
                              </Typography>
                              {startTrace.headers && (
                                <Accordion sx={{ mt: 1 }}>
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                  >
                                    <Typography variant="caption">
                                      Request Headers
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <pre
                                      style={{
                                        fontSize: "11px",
                                        overflow: "auto",
                                        maxHeight: "150px",
                                      }}
                                    >
                                      {JSON.stringify(
                                        startTrace.headers,
                                        null,
                                        2
                                      )}
                                    </pre>
                                  </AccordionDetails>
                                </Accordion>
                              )}
                              {startTrace.body && (
                                <Accordion sx={{ mt: 1 }}>
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                  >
                                    <Typography variant="caption">
                                      Request Body
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <pre
                                      style={{
                                        fontSize: "11px",
                                        overflow: "auto",
                                        maxHeight: "200px",
                                      }}
                                    >
                                      {typeof startTrace.body === "string"
                                        ? startTrace.body
                                        : JSON.stringify(
                                            startTrace.body,
                                            null,
                                            2
                                          )}
                                    </pre>
                                  </AccordionDetails>
                                </Accordion>
                              )}
                            </Box>
                          )}

                          {endTrace && (
                            <Box>
                              <Typography variant="subtitle2" color="secondary">
                                Response Details:
                              </Typography>
                              <Typography variant="body2">
                                Completed: {formatTimestamp(endTrace.timestamp)}
                              </Typography>
                              <Typography variant="body2">
                                Status: {endTrace.statusCode}{" "}
                                {endTrace.statusText}
                              </Typography>
                              {endTrace.responseHeaders && (
                                <Accordion sx={{ mt: 1 }}>
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                  >
                                    <Typography variant="caption">
                                      Response Headers
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <pre
                                      style={{
                                        fontSize: "11px",
                                        overflow: "auto",
                                        maxHeight: "150px",
                                      }}
                                    >
                                      {JSON.stringify(
                                        endTrace.responseHeaders,
                                        null,
                                        2
                                      )}
                                    </pre>
                                  </AccordionDetails>
                                </Accordion>
                              )}
                              {endTrace.responseBody && (
                                <Accordion sx={{ mt: 1 }}>
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                  >
                                    <Typography variant="caption">
                                      Response Body
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <pre
                                      style={{
                                        fontSize: "11px",
                                        overflow: "auto",
                                        maxHeight: "300px",
                                      }}
                                    >
                                      {typeof endTrace.responseBody === "string"
                                        ? endTrace.responseBody
                                        : JSON.stringify(
                                            endTrace.responseBody,
                                            null,
                                            2
                                          )}
                                    </pre>
                                  </AccordionDetails>
                                </Accordion>
                              )}
                              {endTrace.error && (
                                <Accordion sx={{ mt: 1 }}>
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                  >
                                    <Typography variant="caption" color="error">
                                      Error Details
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <pre
                                      style={{
                                        fontSize: "11px",
                                        overflow: "auto",
                                        maxHeight: "200px",
                                        color: "red",
                                      }}
                                    >
                                      {JSON.stringify(endTrace.error, null, 2)}
                                    </pre>
                                  </AccordionDetails>
                                </Accordion>
                              )}
                            </Box>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const AnalyticsTab = () => (
    <Grid container spacing={3}>
      {analytics && (
        <>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Requests
                </Typography>
                <Typography variant="h3" color="primary">
                  {analytics.totalRequests}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Success Rate
                </Typography>
                <Typography variant="h3" color="success.main">
                  {analytics.totalRequests > 0
                    ? `${Math.round(
                        (analytics.successfulRequests /
                          analytics.totalRequests) *
                          100
                      )}%`
                    : "0%"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Failed Requests
                </Typography>
                <Typography variant="h3" color="error.main">
                  {analytics.failedRequests}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Avg Response Time
                </Typography>
                <Typography variant="h3" color="info.main">
                  {formatDuration(analytics.averageResponseTime)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Requests by Status
                </Typography>
                {Object.entries(analytics.requestsByStatus).map(
                  ([status, count]) => (
                    <Box
                      key={status}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Chip
                        label={status}
                        color={getStatusColor(status)}
                        size="small"
                      />
                      <Typography variant="body2">{count}</Typography>
                    </Box>
                  )
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Timeline
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                  {analytics.timeline.slice(0, 10).map((event, index) => (
                    <Box
                      key={index}
                      sx={{ display: "flex", alignItems: "center", mb: 1 }}
                    >
                      <Typography variant="caption" sx={{ minWidth: 100 }}>
                        {formatTimestamp(event.time)}
                      </Typography>
                      <Chip
                        label={event.status}
                        color={getStatusColor(event.status)}
                        size="small"
                        sx={{ mx: 1 }}
                      />
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {event.message}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  );
  const TracesTabDetailed = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Timestamp</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Method</TableCell>
            <TableCell>URL</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Response Time</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredTraces.map((trace) => (
            <TableRow key={trace.id}>
              <TableCell>
                <Typography variant="caption">
                  {formatTimestamp(trace.timestamp)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip label={trace.type} size="small" />
              </TableCell>
              <TableCell>
                {trace.method && (
                  <Chip
                    label={trace.method}
                    color={getMethodColor(trace.method)}
                    size="small"
                  />
                )}
              </TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {trace.url}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={trace.status}
                  color={getStatusColor(trace.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {trace.responseTime && formatDuration(trace.responseTime)}
              </TableCell>
              <TableCell>
                {trace.responseSize && formatBytes(trace.responseSize)}
              </TableCell>
              <TableCell>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="caption">Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Request ID:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ mb: 2, fontFamily: "monospace" }}
                      >
                        {trace.requestId}
                      </Typography>

                      {trace.headers && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            Headers:
                          </Typography>
                          <pre
                            style={{
                              fontSize: "12px",
                              overflow: "auto",
                              maxHeight: "200px",
                            }}
                          >
                            {JSON.stringify(trace.headers, null, 2)}
                          </pre>
                        </>
                      )}

                      {trace.body && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            Body:
                          </Typography>
                          <pre
                            style={{
                              fontSize: "12px",
                              overflow: "auto",
                              maxHeight: "300px",
                            }}
                          >
                            {typeof trace.body === "string"
                              ? trace.body
                              : JSON.stringify(trace.body, null, 2)}
                          </pre>
                        </>
                      )}

                      {trace.error && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            Error:
                          </Typography>
                          <pre
                            style={{
                              fontSize: "12px",
                              overflow: "auto",
                              maxHeight: "200px",
                              color: "red",
                            }}
                          >
                            {JSON.stringify(trace.error, null, 2)}
                          </pre>
                        </>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          {/* <Tooltip title="Filter">
            <IconButton onClick={() => setFilterDialogOpen(true)}>
              <FilterIcon />
            </IconButton>
          </Tooltip> */}
          {/* <Tooltip title="Export">
            <IconButton onClick={exportTraces}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip> */}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        {/* <Tab icon={<AnalyticsIcon />} label="Analytics" /> */}
        {/* <Tab icon={<HttpIcon />} label="Methods" /> */}
        <Tab icon={<TimelineIcon />} label={`Traces`} />
      </Tabs>

      {currentTab === 0 && <AnalyticsTab />}
      {currentTab === 1 && <MethodAnalyticsTab />}
      {currentTab === 2 && <TracesTab />}

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Traces</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="SUCCESS">Success</MenuItem>
                  <MenuItem value="ERROR">Error</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="REQUEST_START">Request Start</MenuItem>
                  <MenuItem value="REQUEST_COMPLETE">Request Complete</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Method</InputLabel>
                <Select
                  value={filters.method}
                  label="Method"
                  onChange={(e) =>
                    setFilters({ ...filters, method: e.target.value })
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setFilters({ status: "", type: "", method: "" })}
          >
            Clear
          </Button>
          <Button
            onClick={() => setFilterDialogOpen(false)}
            variant="contained"
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestTracker;
