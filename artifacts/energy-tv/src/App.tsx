/**
 * App.tsx  (updated — adds AuthProvider + /signin route)
 * -------------------------------------------------------
 * Diff from original:
 *  + import { AuthProvider } from "@/context/AuthContext"
 *  + import SignIn from "@/pages/SignIn"
 *  + <Route path="/signin" component={SignIn} />
 *  + Wrap everything in <AuthProvider>
 */

import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import BottomTabBar from "@/components/BottomTabBar";
import UpdateBanner from "@/components/UpdateBanner";
import LoadingScreen from "@/components/LoadingScreen";
import AmbientBootSound from "@/components/AmbientBootSound";
import Home from "@/pages/Home";
import Movies from "@/pages/Movies";
import TVShows from "@/pages/TVShows";
import Search from "@/pages/Search";
import Games from "@/pages/Games";
import Watchlist from "@/pages/Watchlist";
import Detail from "@/pages/Detail";
import Settings from "@/pages/Settings";
import SignIn from "@/pages/SignIn";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Forum from "@/pages/Forum";
import ForumThread from "@/pages/ForumThread";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function Router() {
  return (
    <>
      <Navbar />
      <BottomTabBar />
      <UpdateBanner />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/movies" component={Movies} />
        <Route path="/tv" component={TVShows} />
        <Route path="/search" component={Search} />
        <Route path="/games" component={Games} />
        <Route path="/watchlist" component={Watchlist} />
        <Route path="/detail/:type/:id" component={Detail} />
        <Route path="/settings" component={Settings} />
        <Route path="/signin" component={SignIn} />
        <Route path="/profile/edit" component={EditProfile} />
        <Route path="/u/:username" component={Profile} />
        <Route path="/forum" component={Forum} />
        <Route path="/forum/:id" component={ForumThread} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  const [booting, setBooting] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <Router />
          <AmbientBootSound />
          {booting && <LoadingScreen onFinish={() => setBooting(false)} />}
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
