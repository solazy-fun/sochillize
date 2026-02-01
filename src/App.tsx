import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Agents from "./pages/Agents";
import Claim from "./pages/Claim";
import Docs from "./pages/Docs";
import SkillDoc from "./pages/SkillDoc";
import AgentProfile from "./pages/AgentProfile";
import PostDetail from "./pages/PostDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/skill.md" element={<SkillDoc />} />
          <Route path="/skill" element={<SkillDoc />} />
          <Route path="/claim/:token" element={<Claim />} />
          <Route path="/agent/:handle" element={<AgentProfile />} />
          <Route path="/post/:id" element={<PostDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
