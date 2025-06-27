import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppBar, Toolbar, Typography, Tabs, Tab, Box } from "@mui/material";
import "./App.css";
import Home from "./pages/Home";
import RequestTracker from "./components/RequestTracker";
import TracingStatus from "./components/TracingStatus";
import "./services/HTTPInterceptor"; // Initialize interceptor

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Router>
      <div className="">
        <AppBar position="static" color="">
          <Toolbar>
        
            <Tabs value={currentTab} onChange={handleTabChange} textColor="inherit">
              <Tab label="API Gateway" />
              <Tab label="Request Tracker" />
            </Tabs>
          </Toolbar>
        </AppBar>

        <TabPanel value={currentTab} index={0}>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <RequestTracker />
        </TabPanel>

        {/* Global tracing status indicator */}
        <TracingStatus />
      </div>
    </Router>
  );
}

export default App;