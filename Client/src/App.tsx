import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import Layout from "./layout/layout";
import { queryClient } from "./lib/queryClient";
import Donate from "./Pages/donate";
import Feedback from "./Pages/feedback";
import Home from "./Pages/home";
import News from "./Pages/news";
import NotFound from "./Pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/news" component={News} />
      <Route path="/feedback" component={Feedback} />
      <Route path="/donate" component={Donate} />
      <Route path="/about" component={Feedback} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Router />
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
