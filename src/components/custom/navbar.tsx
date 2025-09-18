import { Link, useNavigate } from "react-router-dom";
import { SlashIcon, MenuIcon } from "./icons";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAuth } from "@/context/AuthProvider";
import { useSidebar } from "@/context/SidebarProvider";

export const Navbar = () => {
  const { user, login, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {   
      console.error('Sign out error:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await login();
      navigate('/');
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <>
      <div className="bg-[#181A20]/90 backdrop-blur-md fixed top-0 left-0 w-full py-3 px-4 justify-between flex flex-row items-center z-30">
        <div className="flex flex-row gap-3 items-center">
          {user && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="text-xs bg-[#23272e] border-[#2d3138] text-zinc-300 hover:bg-[#2d3138] hover:text-white"
                title="Chat History"
              >
                <MenuIcon size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Dispatch custom event to reset chat
                  window.dispatchEvent(new CustomEvent('newChat'));
                }}
                className="text-xs bg-[#23272e] border-[#2d3138] text-zinc-300 hover:bg-[#2d3138] hover:text-white"
              >
                New Chat
              </Button>
            </>
          )}
          <Link to="/">
            <div className="flex flex-row gap-2 items-center">
              <img
                src={chrome.runtime?.getURL ? chrome.runtime.getURL('vite.svg') : '/vite.svg'}
                height={20}
                width={20}
                alt="Algo Chat"
              />
              <div className="text-zinc-400">
                <SlashIcon size={16} />
              </div>
              <div className="text-sm text-white font-semibold truncate w-28 md:w-fit">
                Algo Chat
              </div>
            </div>
          </Link>
        </div>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="py-2 px-3 h-fit font-normal bg-[#23272e] border border-[#2d3138] text-zinc-300 hover:bg-[#2d3138] hover:text-white transition-colors"
                variant="secondary"
              >
                {user.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#181A20] border border-[#23272e]">
              <DropdownMenuItem className="text-zinc-300 hover:bg-[#23272e] hover:text-white">
              </DropdownMenuItem>
              <DropdownMenuItem className="p-1 z-50 text-zinc-300 hover:bg-[#23272e] hover:text-white">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-1 py-0.5 text-red-400 hover:text-red-300 transition-colors"
                >
                  Sign out
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button className="py-2 px-3 h-fit font-normal text-white bg-green-600 hover:bg-green-700 border-green-700" onClick={handleSignIn}>
            Login
          </Button>
        )}
      </div>
    </>
  );
};