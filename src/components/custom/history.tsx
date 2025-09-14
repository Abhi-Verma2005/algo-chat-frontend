"use client";

import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Link } from "react-router-dom";
import { cn, fetcher } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarProvider";

import {
  InfoIcon,
  MenuIcon,
  MoreHorizontalIcon,
  PencilEditIcon,
  TrashIcon,
} from "./icons";
import { Button } from "../ui/button";
import { ChatHistory } from "./chat-history";

export const History = ({ user }: { user: any | undefined }) => {
  const { id } = useParams();
  const location = useLocation();
  const { setSidebarContent } = useSidebar();

  const handleOpenHistory = () => {
    setSidebarContent(<ChatHistory />);
  };

  return (
    <Button
      variant="outline"
      className="p-2 h-fit"
      onClick={handleOpenHistory}
      title="View Chat History"
    >
      <MenuIcon />
    </Button>
  );
};
