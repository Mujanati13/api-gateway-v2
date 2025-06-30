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
  Drawer,
  Switch,
  FormControlLabel,
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
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { httpInterceptor } from "../services/HTTPInterceptor";
import { traceService } from "../services/FirebaseTraceService";
import axios from 'axios';

// Environment Configuration
const ENV_CONFIG = {
  DEV: {
    apiUrl: "https://api.stage.kautionsfrei.de",
    name: "Development"
  },
  PROD: {
    apiUrl: "https://api.kautionsfrei.de", // Replace with your actual prod URL
    name: "Production"
  }
};

// Configuration toggles
const FIREBASE_ENABLED = true; // Set to false to disable Firebase functions
const CURRENT_ENV = "PROD"; // Switch between "DEV" and "PROD"

const RequestTracker = () => {
  // ...existing state...
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTraceGroup, setSelectedTraceGroup] = useState(null);
  const [currentEnv, setCurrentEnv] = useState(CURRENT_ENV);
  const [firebaseEnabled, setFirebaseEnabled] = useState(FIREBASE_ENABLED);

  // Set initial axios baseURL
  useEffect(() => {
    axios.defaults.baseURL = ENV_CONFIG[currentEnv].apiUrl;
  }, []);

  // Update axios baseURL when environment changes
  useEffect(() => {
    axios.defaults.baseURL = ENV_CONFIG[currentEnv].apiUrl;
    console.log(`🔄 Environment switched to ${currentEnv}: ${ENV_CONFIG[currentEnv].apiUrl}`);
    
    // Refresh data with new environment
    loadTraces();
    loadAnalytics();
    if (firebaseEnabled) {
      loadMethodStats();
    }
  }, [currentEnv]);

  useEffect(() => {
    loadTraces();
    loadAnalytics();
    if (firebaseEnabled) {
      loadMethodStats();
    }
  }, [firebaseEnabled]);

  const loadTraces = async () => {
    try {
      setLoading(true);
      const sessionTraces = await httpInterceptor.getSessionTraces();
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
    if (!firebaseEnabled) {
      console.log("Firebase is disabled - skipping method stats");
      setMethodStats({
        totalRequests: 0,
        byMethod: {},
        responseTimeStats: {
          average: 0,
          min: 0,
          max: 0,
        },
      });
      return;
    }

    try {
      const stats = await traceService.getMethodStatistics();
      setMethodStats(stats);
    } catch (err) {
      console.error("Failed to load method statistics:", err);
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
    if (firebaseEnabled) {
      loadMethodStats();
    }
  };

  const handleTabChange = (event, newValue) => setCurrentTab(newValue);

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
        return <GetAppIcon fontSize="small" />;
      case "POST":
        return <SendIcon fontSize="small" />;
      default:
        return <HttpIcon fontSize="small" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid Date";
      return (
        date.toLocaleString() +
        "." +
        date.getMilliseconds().toString().padStart(3, "0")
      );
    } catch {
      return "Invalid Date";
    }
  };

  const formatDuration = (ms) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`);
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024,
      sizes = ["B", "KB", "MB", "GB"],
      i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredTraces = traces.filter((trace) => {
    if (filters.status && trace.status !== filters.status) return false;
    if (filters.type && trace.type !== filters.type) return false;
    if (filters.method && trace.method !== filters.method) return false;
    return true;
  });

  const groupedTraces = {};
  filteredTraces.forEach((trace) => {
    if (!groupedTraces[trace.requestId]) groupedTraces[trace.requestId] = [];
    groupedTraces[trace.requestId].push(trace);
  });

  const openDrawer = (group) => {
    setSelectedTraceGroup(group);
    setDrawerOpen(true);
  };

  const DrawerContent = () => {
    if (!selectedTraceGroup) return null;
    const startTrace = selectedTraceGroup.find((t) => t.type === "REQUEST_START");
    const endTrace = selectedTraceGroup.find((t) => t.type === "REQUEST_COMPLETE");

    return (
      <Box sx={{ p: 3, width: { xs: "100%", sm: 400 } }}>
        <Typography variant="h6" gutterBottom>
          Request Details
        </Typography>
        {startTrace && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Started:</Typography>
            <Typography variant="body2" gutterBottom>
              {formatTimestamp(startTrace.timestamp)}
            </Typography>
            {startTrace.method && (
              <Chip
                icon={getMethodIcon(startTrace.method)}
                label={startTrace.method}
                color={getMethodColor(startTrace.method)}
                size="small"
                sx={{ mb: 1 }}
              />
            )}
            <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
              {startTrace.url}
            </Typography>
            {startTrace.headers && (
              <Accordion sx={{ mt: 1 }} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="caption">Request Headers</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <pre style={{ fontSize: 11 }}>
                    {JSON.stringify(startTrace.headers, null, 2)}
                  </pre>
                </AccordionDetails>
              </Accordion>
            )}
            {startTrace.body && (
              <Accordion sx={{ mt: 1 }} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="caption">Request Body</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <pre style={{ fontSize: 11 }}>
                    {typeof startTrace.body === "string"
                      ? startTrace.body
                      : JSON.stringify(startTrace.body, null, 2)}
                  </pre>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}
        {endTrace && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Response Details
            </Typography>
            <Typography variant="body2" gutterBottom>
              Completed: {formatTimestamp(endTrace.timestamp)}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Status: {endTrace.statusCode} {endTrace.statusText}
            </Typography>
            {endTrace.responseHeaders && (
              <Accordion sx={{ mt: 1 }} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="caption">Response Headers</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <pre style={{ fontSize: 11 }}>
                    {JSON.stringify(endTrace.responseHeaders, null, 2)}
                  </pre>
                </AccordionDetails>
              </Accordion>
            )}
            {endTrace.responseBody && (
              <Accordion sx={{ mt: 1 }} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="caption">Response Body</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ maxHeight: "50vh", overflowY: "auto" }}>
                  <pre style={{ fontSize: 11 }}>
                    {typeof endTrace.responseBody === "string"
                      ? endTrace.responseBody
                      : JSON.stringify(endTrace.responseBody, null, 2)}
                  </pre>
                </AccordionDetails>
              </Accordion>
            )}
            {endTrace.error && (
              <Accordion sx={{ mt: 1 }} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="caption" color="error">
                    Error Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <pre style={{ fontSize: 11, color: "red" }}>
                    {JSON.stringify(endTrace.error, null, 2)}
                  </pre>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const TracesTab = () => (
    <Box sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer
        component={Paper}
        sx={{ 
          bgcolor: "#fff", 
          maxHeight: "70vh", 
          overflow: "auto",
          border: "1px solid #e0e0e0"
        }}
      >
        <Table stickyHeader size="small" sx={{ 
          tableLayout: "fixed",
          "& .MuiTableCell-root": {
            border: "1px solid #e0e0e0"
          }
        }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 140, fontWeight: "bold" }}>Time</TableCell>
              <TableCell sx={{ width: 100, textAlign: "center", fontWeight: "bold" }}>Method</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>URL</TableCell>
              <TableCell sx={{ width: 100, textAlign: "center", fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ width: 80, textAlign: "center", fontWeight: "bold" }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(groupedTraces).map(([requestId, group]) => {
              const startTrace = group.find((t) => t.type === "REQUEST_START");
              const endTrace = group.find((t) => t.type === "REQUEST_COMPLETE");
              const displayTrace = endTrace || startTrace;
              if (!displayTrace) return null;
              return (
                <TableRow key={requestId} sx={{ opacity: endTrace ? 1 : 0.7 }}>
                  <TableCell sx={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
                    {formatTimestamp(displayTrace.timestamp)}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Chip
                      icon={getMethodIcon(displayTrace.method)}
                      label={displayTrace.method || "N/A"}
                      color={getMethodColor(displayTrace.method)}
                      size="small"
                      sx={{ minWidth: 70, fontSize: "0.7rem" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                      {displayTrace.url}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Chip
                      label={displayTrace.status}
                      color={getStatusColor(displayTrace.status)}
                      size="small"
                      sx={{ minWidth: 70, fontSize: "0.7rem" }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Tooltip title="View details">
                      <IconButton onClick={() => openDrawer(group)} size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        transitionDuration={400}
      >
        <DrawerContent />
      </Drawer>
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* Configuration Controls */}
      {/* <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        mb: 3,
        p: 2,
        bgcolor: "grey.50",
        borderRadius: 1,
        border: "1px solid #e0e0e0"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Firebase Functions
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={firebaseEnabled}
                  onChange={(e) => setFirebaseEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label={firebaseEnabled ? "Enabled" : "Disabled"}
            />
          </Box>
        </Box>

        <Box sx={{ textAlign: "right" }}>
          <br />
          <Typography variant="caption" color="textSecondary">
            Firebase: {firebaseEnabled ? "Active" : "Inactive"}
          </Typography>
        </Box>
      </Box> */}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {currentTab === 2 && <TracesTab />}
    </Box>
  );
};

export default RequestTracker;
