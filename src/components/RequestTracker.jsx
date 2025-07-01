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
    // Filter out Testing Firebase connection traces
    if (trace.type === 'CONNECTION_TEST' || 
        (trace.message && trace.message.includes('Testing Firebase connection'))) {
      return false;
    }
    
    if (filters.status && trace.status !== filters.status) return false;
    if (filters.type && trace.type !== filters.type) return false;
    if (filters.method && trace.method !== filters.method) return false;
    return true;
  });

  // Group traces by cycles instead of just requestId
  const groupTracesIntoCycles = (traces) => {
    const cycles = {};
    let cycleCounter = 1;
    
    // Sort traces by timestamp to process chronologically
    const sortedTraces = [...traces].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // First pass: identify only the 3 specific step traces (only REQUEST_COMPLETE to avoid duplicates)
    const cycleTraces = sortedTraces.filter((trace) => {
      // Only include completed requests to avoid duplicating START and COMPLETE traces
      if (trace.type !== 'REQUEST_COMPLETE') {
        return false;
      }
      
      const isProtocolDataRequest = trace.url && 
        trace.url.includes('x-cite-web.de:5000/api/protocol/data/') && 
        trace.method === 'GET';
      
      const isTenancySubmission = trace.url && 
        trace.url.includes('/api/tenancies') && 
        trace.method === 'POST';
      
      const isStatusCheck = trace.url && 
        trace.url.includes('/api/application/state/') && 
        trace.method === 'GET';
      
      // Only include traces that match our 3 specific steps
      return isProtocolDataRequest || isTenancySubmission || isStatusCheck;
    });
    
    // Second pass: group these filtered traces into cycles
    let currentCycleId = null;
    let currentCycleStep = 0; // 0: waiting for step 1, 1: waiting for step 2, 2: waiting for step 3
    
    cycleTraces.forEach((trace) => {
      const isProtocolDataRequest = trace.url && 
        trace.url.includes('x-cite-web.de:5000/api/protocol/data/') && 
        trace.method === 'GET' && 
        trace.type === 'REQUEST_COMPLETE';
      
      const isTenancySubmission = trace.url && 
        trace.url.includes('/api/tenancies') && 
        trace.method === 'POST' && 
        trace.type === 'REQUEST_COMPLETE';
      
      const isStatusCheck = trace.url && 
        trace.url.includes('/api/application/state/') && 
        trace.method === 'GET' && 
        trace.type === 'REQUEST_COMPLETE';
      
      // Start new cycle when we see step 1 (protocol data request)
      if (isProtocolDataRequest && currentCycleStep === 0) {
        currentCycleId = `cycle-${cycleCounter}`;
        cycleCounter++;
        currentCycleStep = 1;
        
        if (!cycles[currentCycleId]) {
          cycles[currentCycleId] = [];
        }
        cycles[currentCycleId].push(trace);
      }
      // Add step 2 (tenancy submission) to current cycle
      else if (isTenancySubmission && currentCycleStep === 1 && currentCycleId) {
        cycles[currentCycleId].push(trace);
        currentCycleStep = 2;
      }
      // Add step 3 (status check) to current cycle and complete it
      else if (isStatusCheck && currentCycleStep === 2 && currentCycleId) {
        cycles[currentCycleId].push(trace);
        currentCycleStep = 0; // Reset for next cycle
        currentCycleId = null;
      }
      // If trace doesn't fit the expected sequence, start a new cycle
      else if (isProtocolDataRequest) {
        currentCycleId = `cycle-${cycleCounter}`;
        cycleCounter++;
        currentCycleStep = 1;
        
        if (!cycles[currentCycleId]) {
          cycles[currentCycleId] = [];
        }
        cycles[currentCycleId].push(trace);
      }
    });
    
    return cycles;
  };

  const groupedTraces = groupTracesIntoCycles(filteredTraces);

  const openDrawer = (group) => {
    setSelectedTraceGroup(group);
    setDrawerOpen(true);
  };

  const DrawerContent = () => {
    if (!selectedTraceGroup) return null;
    
    // Sort traces within the selected cycle by timestamp
    const sortedTraces = selectedTraceGroup.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return (
      <Box sx={{ p: 3, width: { xs: "100%", sm: 500 } }}>
        <Typography variant="h6" gutterBottom>
          Cycle Details ({sortedTraces.length} requests)
        </Typography>
        
        {/* Cycle Timeline */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Cycle Steps:
          </Typography>
          {sortedTraces.map((trace, index) => {
            // Since we're only showing REQUEST_COMPLETE traces, all traces are completed requests
            const isComplete = trace.type === "REQUEST_COMPLETE";
            
            // Identify cycle step
            let stepLabel = `Step ${index + 1}`;
            let stepType = 'Other';
            
            if (trace.url && trace.url.includes('x-cite-web.de:5000/api/protocol/data/') && trace.method === 'GET') {
              stepType = '1. Protocol Data';
              stepLabel = 'Protocol Data Request';
            } else if (trace.url && trace.url.includes('/api/tenancies') && trace.method === 'POST') {
              stepType = '2. Tenancy Submit';
              stepLabel = 'Tenancy Submission';
            } else if (trace.url && trace.url.includes('/api/application/state/') && trace.method === 'GET') {
              stepType = '3. Status Check';
              stepLabel = 'Status Check';
            }
            
            return (
              <Box key={`${trace.requestId}-${index}`} sx={{ mb: 2, pl: 2, borderLeft: "2px solid #e0e0e0" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Chip
                    size="small"
                    label={stepType}
                    color={stepType.startsWith('1.') ? "primary" : stepType.startsWith('2.') ? "secondary" : stepType.startsWith('3.') ? "success" : "default"}
                    sx={{ minWidth: 120, fontSize: "0.7rem" }}
                  />
                  {trace.method && (
                    <Chip
                      icon={getMethodIcon(trace.method)}
                      label={trace.method}
                      color={getMethodColor(trace.method)}
                      size="small"
                    />
                  )}
                  <Chip
                    label={trace.status || trace.type}
                    color={getStatusColor(trace.status)}
                    size="small"
                  />
                  <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                    {formatTimestamp(trace.timestamp)}
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 1, fontWeight: stepType !== 'Other' ? 'bold' : 'normal' }}>
                  {stepLabel}
                </Typography>
                
                <Typography variant="body2" sx={{ wordBreak: "break-all", mb: 1, fontSize: "0.8rem", color: "textSecondary" }}>
                  {trace.url || trace.message || 'Event'}
                </Typography>
                
                {(trace.responseTime) && (
                  <Typography variant="caption" color="textSecondary">
                    Response time: {trace.responseTime}ms
                  </Typography>
                )}
                
                {/* Expandable details for each request */}
                <Accordion size="small" sx={{ mt: 1 }} disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="caption">Request Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {trace.headers && (
                      <Accordion sx={{ mt: 1 }} disableGutters>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="caption">
                            Response Headers
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <pre style={{ fontSize: 10 }}>
                            {JSON.stringify(trace.responseHeaders || trace.headers, null, 2)}
                          </pre>
                        </AccordionDetails>
                      </Accordion>
                    )}
                    
                    {trace.responseBody && (
                      <Accordion sx={{ mt: 1 }} disableGutters>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="caption">
                            Response Body
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ maxHeight: "30vh", overflowY: "auto" }}>
                          <pre style={{ fontSize: 10 }}>
                            {typeof trace.responseBody === "string"
                              ? trace.responseBody
                              : JSON.stringify(trace.responseBody, null, 2)}
                          </pre>
                        </AccordionDetails>
                      </Accordion>
                    )}
                    
                    {trace.error && (
                      <Accordion sx={{ mt: 1 }} disableGutters>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="caption" color="error">
                            Error Details
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <pre style={{ fontSize: 10, color: "red" }}>
                            {JSON.stringify(trace.error, null, 2)}
                          </pre>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
            );
          })}
        </Box>
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
              <TableCell sx={{ width: 120, fontWeight: "bold" }}>Cycle</TableCell>
              <TableCell sx={{ width: 140, fontWeight: "bold" }}>Time</TableCell>
              <TableCell sx={{ width: 80, textAlign: "center", fontWeight: "bold" }}>Requests</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Summary</TableCell>
              <TableCell sx={{ width: 100, textAlign: "center", fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ width: 80, textAlign: "center", fontWeight: "bold" }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(groupedTraces).map(([cycleId, cycleTraces]) => {
              // Sort traces within cycle by timestamp
              const sortedCycleTraces = cycleTraces.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              const firstTrace = sortedCycleTraces[0];
              const lastTrace = sortedCycleTraces[sortedCycleTraces.length - 1];
              
              // Determine cycle summary based on the 3-step pattern
              const protocolDataRequests = sortedCycleTraces.filter(t => 
                t.url && t.url.includes('x-cite-web.de:5000/api/protocol/data/') && t.method === 'GET'
              );
              const tenancySubmissions = sortedCycleTraces.filter(t => 
                t.url && t.url.includes('/api/tenancies') && t.method === 'POST'
              );
              const statusChecks = sortedCycleTraces.filter(t => 
                t.url && t.url.includes('/api/application/state/') && t.method === 'GET'
              );
              
              let cycleSummary = '';
              const steps = [];
              if (protocolDataRequests.length > 0) steps.push('Protocol Data');
              if (tenancySubmissions.length > 0) steps.push('Tenancy Submit');
              if (statusChecks.length > 0) steps.push('Status Check');
              
              if (steps.length === 3) {
                cycleSummary = 'Complete Cycle (3/3 steps)';
              } else if (steps.length > 0) {
                cycleSummary = `Partial Cycle (${steps.length}/3): ${steps.join(' → ')}`;
              } else {
                cycleSummary = 'Other requests';
              }
              
              // Overall cycle status
              const hasErrors = sortedCycleTraces.some(t => t.status === 'ERROR');
              const allCompleted = sortedCycleTraces.every(t => t.status !== 'PENDING');
              const cycleStatus = hasErrors ? 'ERROR' : allCompleted ? 'SUCCESS' : 'PENDING';
              
              return (
                <TableRow key={cycleId} sx={{ opacity: allCompleted ? 1 : 0.7 }}>
                  <TableCell>
                    <Chip 
                      label={cycleId.replace('cycle-', 'Cycle ')} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
                    {formatTimestamp(firstTrace.timestamp)}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Chip
                      label={sortedCycleTraces.length}
                      size="small"
                      color="default"
                      sx={{ minWidth: 40, fontSize: "0.7rem" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                      {cycleSummary || 'Mixed requests'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Chip
                      label={cycleStatus}
                      color={getStatusColor(cycleStatus)}
                      size="small"
                      sx={{ minWidth: 70, fontSize: "0.7rem" }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Tooltip title="View cycle details">
                      <IconButton onClick={() => openDrawer(sortedCycleTraces)} size="small">
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
