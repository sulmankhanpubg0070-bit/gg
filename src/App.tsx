import React, { useState, useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  UserPlus, 
  Heart, 
  FolderDown, 
  FolderUp, 
  RefreshCw, 
  SearchCode, 
  HelpCircle,
  FileText,
  Bookmark,
  Share2,
  Check,
  ChevronDown,
  Info,
  Layers,
  Sparkles,
  ArrowRightLeft,
  X
} from "lucide-react";
import { FamilyMember, RelationType, TreeStats } from "./types";
import { initialFamilyMembers } from "./initialData";

const defaultNewMember = (): FamilyMember => ({
  id: "",
  name: "",
  gender: "male",
  birthYear: "",
  deathYear: "",
  birthPlace: "",
  occupation: "",
  notes: ""
});

export default function App() {
  const [lang, setLang] = useState<"en" | "ur">("en");
  
  // SVG and Container refs for D3 connectors
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // State for all family members
  const [members, setMembers] = useState<FamilyMember[]>(() => {
    const saved = localStorage.getItem("family_tree_members");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Could not parse saved family tree, fallback to default seed data.");
      }
    }
    return initialFamilyMembers;
  });

  // Selected member for detail view & relative addition
  const [selectedId, setSelectedId] = useState<string>(() => {
    return initialFamilyMembers[6]?.id || ""; // Default selected is "Sulman Khan"
  });

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Editor modes & form states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<FamilyMember>(defaultNewMember());
  
  // state for adding a relative
  const [relativeMode, setRelativeMode] = useState<RelationType>("none");
  const [relativeForm, setRelativeForm] = useState<FamilyMember>(defaultNewMember());

  // notifications state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Popup state for clicking details
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Auto-sync database changes to client's browser local storage
  useEffect(() => {
    localStorage.setItem("family_tree_members", JSON.stringify(members));
  }, [members]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Switch Selected ID safely when deleting or changing
  const selectedMember = useMemo(() => {
    return members.find(m => m.id === selectedId) || members[0] || null;
  }, [members, selectedId]);

  // State for dragging/panning the tree canvas
  const [isDragPanning, setIsDragPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panScroll, setPanScroll] = useState({ left: 0, top: 0 });

  // D3 drawing function for connecting family nodes
  const drawLines = () => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl || members.length === 0) return;

    // Use full scrollable area dimensions so coordinates match exactly
    const sWidth = Math.max(containerEl.scrollWidth, containerEl.clientWidth);
    const sHeight = Math.max(containerEl.scrollHeight, containerEl.clientHeight);
    
    svgEl.setAttribute("width", `${sWidth}`);
    svgEl.setAttribute("height", `${sHeight}`);

    const containerRect = containerEl.getBoundingClientRect();

    interface CalculatedLink {
      id: string;
      type: "spouse" | "parent-child-father" | "parent-child-mother" | "parent-child-couple";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      isActive: boolean;
    }

    const resolvedLinks: CalculatedLink[] = [];
    const spouseDrawn = new Set<string>();

    members.forEach((member) => {
      // 1. Spouses (A to B)
      if (member.spouseId) {
        const key = [member.id, member.spouseId].sort().join("-");
        if (!spouseDrawn.has(key)) {
          spouseDrawn.add(key);
          const sourceCard = document.getElementById(`node-member-${member.id}`);
          const targetCard = document.getElementById(`node-member-${member.spouseId}`);

          if (sourceCard && targetCard) {
            const sRect = sourceCard.getBoundingClientRect();
            const tRect = targetCard.getBoundingClientRect();
            
            if (sRect.width > 0 && tRect.width > 0) {
              const isActive = selectedId === member.id || selectedId === member.spouseId;
              const sLeftOfTarget = sRect.left < tRect.left;

              const x1 = sLeftOfTarget 
                ? (sRect.right - containerRect.left + containerEl.scrollLeft) 
                : (sRect.left - containerRect.left + containerEl.scrollLeft);
              const y1 = (sRect.top + sRect.height / 2) - containerRect.top + containerEl.scrollTop;

              const x2 = sLeftOfTarget 
                ? (tRect.left - containerRect.left + containerEl.scrollLeft) 
                : (tRect.right - containerRect.left + containerEl.scrollLeft);
              const y2 = (tRect.top + tRect.height / 2) - containerRect.top + containerEl.scrollTop;

              resolvedLinks.push({
                id: `spouse-${key}`,
                type: "spouse",
                x1,
                y1,
                x2,
                y2,
                isActive
              });
            }
          }
        }
      }

      // 2. Parent-Child direct lineage connections
      const childCard = document.getElementById(`node-member-${member.id}`);
      if (childCard) {
        const cRect = childCard.getBoundingClientRect();
        if (cRect.width > 0) {
          const cx = (cRect.left + cRect.width / 2) - containerRect.left + containerEl.scrollLeft;
          const cy = cRect.top - containerRect.top + containerEl.scrollTop;

          const fatherCard = member.fatherId ? document.getElementById(`node-member-${member.fatherId}`) : null;
          const motherCard = member.motherId ? document.getElementById(`node-member-${member.motherId}`) : null;

          if (fatherCard && motherCard) {
            // BOTH parents exist: connect to vertical parent-couple midpoint
            const fRect = fatherCard.getBoundingClientRect();
            const mRect = motherCard.getBoundingClientRect();

            if (fRect.width > 0 && mRect.width > 0) {
              const fx = (fRect.left + fRect.width / 2) - containerRect.left + containerEl.scrollLeft;
              const fy = fRect.bottom - containerRect.top + containerEl.scrollTop;

              const mx = (mRect.left + mRect.width / 2) - containerRect.left + containerEl.scrollLeft;
              const my = mRect.bottom - containerRect.top + containerEl.scrollTop;

              // Center point of parents connection
              const midX = (fx + mx) / 2;
              const midY = (fy + my) / 2;

              const isActive = selectedId === member.id || selectedId === member.fatherId || selectedId === member.motherId;

              resolvedLinks.push({
                id: `couple-child-${member.id}`,
                type: "parent-child-couple",
                x1: midX,
                y1: midY,
                x2: cx,
                y2: cy,
                isActive
              });
            }
          } else if (fatherCard) {
            // ONLY Father
            const fRect = fatherCard.getBoundingClientRect();
            if (fRect.width > 0) {
              const fx = (fRect.left + fRect.width / 2) - containerRect.left + containerEl.scrollLeft;
              const fy = fRect.bottom - containerRect.top + containerEl.scrollTop;

              const isActive = selectedId === member.id || selectedId === member.fatherId;

              resolvedLinks.push({
                id: `father-child-${member.id}`,
                type: "parent-child-father",
                x1: fx,
                y1: fy,
                x2: cx,
                y2: cy,
                isActive
              });
            }
          } else if (motherCard) {
            // ONLY Mother
            const mRect = motherCard.getBoundingClientRect();
            if (mRect.width > 0) {
              const mx = (mRect.left + mRect.width / 2) - containerRect.left + containerEl.scrollLeft;
              const my = mRect.bottom - containerRect.top + containerEl.scrollTop;

              const isActive = selectedId === member.id || selectedId === member.motherId;

              resolvedLinks.push({
                id: `mother-child-${member.id}`,
                type: "parent-child-mother",
                x1: mx,
                y1: my,
                x2: cx,
                y2: cy,
                isActive
              });
            }
          }
        }
      }
    });

    const svg = d3.select(svgEl);

    // Path curves generator using simple clean orthogonal elbow step-lines (classic family tree connector)
    const pathGenerator = (link: CalculatedLink) => {
      const path = d3.path();
      if (link.type === "spouse") {
        // Spouse line is horizontal
        path.moveTo(link.x1, link.y1);
        const midX = (link.x1 + link.x2) / 2;
        // Minor sag to make the marriage link distinct
        path.quadraticCurveTo(midX, Math.min(link.y1, link.y2) - 10, link.x2, link.y2);
      } else {
        // Clean orthogonal pedigree elbow drop: vertical down -> horizontal -> vertical down
        path.moveTo(link.x1, link.y1);
        const midY = link.y1 + (link.y2 - link.y1) * 0.45;
        path.lineTo(link.x1, midY);
        path.lineTo(link.x2, midY);
        path.lineTo(link.x2, link.y2);
      }
      return path.toString();
    };

    const u = svg.selectAll<SVGPathElement, CalculatedLink>("path.tree-link")
      .data(resolvedLinks, d => d.id);

    u.exit().remove();

    u.enter()
      .append("path")
      .attr("class", "tree-link")
      .merge(u)
      .attr("d", d => pathGenerator(d))
      .attr("fill", "none")
      .attr("stroke", d => {
        if (d.type === "spouse") {
          return d.isActive ? "#ec4899" : "#fbcfe8"; // glowing rose pink marriage connector
        } else if (d.type === "parent-child-couple") {
          return d.isActive ? "#4f46e5" : "#cbd5e1"; // indigo for double parent union link
        } else if (d.type === "parent-child-father") {
          return d.isActive ? "#2563eb" : "#cbd5e1"; // sharp blue
        } else {
          return d.isActive ? "#db2777" : "#cbd5e1"; // sharp rose
        }
      })
      .attr("stroke-width", d => (d.isActive ? 4 : 2))
      .attr("stroke-dasharray", d => {
        if (d.type === "spouse") return "5, 5"; // Dashed connection for spouse
        return "none";
      })
      .style("transition", "stroke 0.2s, stroke-width 0.2s, opacity 0.2s")
      .attr("opacity", d => {
        if (searchQuery) {
          return d.isActive ? 1 : 0.15;
        }
        return d.isActive ? 1 : 0.70;
      });
  };

  // Trigger drawing update whenever cards state changes
  useEffect(() => {
    drawLines();

    // Staggered timers to allow layouts, animations and state changes to settle
    const timer1 = setTimeout(drawLines, 50);
    const timer2 = setTimeout(drawLines, 150);
    const timer3 = setTimeout(drawLines, 300);
    const timer4 = setTimeout(drawLines, 600);

    // Watch resize of tree canvas using ResizeObserver
    const container = containerRef.current;
    let robserver: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== "undefined") {
      robserver = new ResizeObserver(() => {
        drawLines();
      });
      robserver.observe(container);
    }

    // Window resize event handler as fallback
    window.addEventListener("resize", drawLines);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      if (robserver && container) {
        robserver.unobserve(container);
      }
      window.removeEventListener("resize", drawLines);
    };
  }, [members, selectedId, searchQuery, lang, relativeMode, isEditing]);

  // Adjust selected ID if the current selection gets deleted
  useEffect(() => {
    if (members.length > 0 && !members.some(m => m.id === selectedId)) {
      setSelectedId(members[0].id);
    }
  }, [members, selectedId]);

  // Mouse drag-to-scroll (pan) event handlers for Figma-like canvas navigation
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Do not initiate drag if user is clicking interactive elements (buttons, inputs, or node cards)
    if (
      target.closest("button") || 
      target.closest("input") || 
      target.closest("[id^='node-member-']")
    ) {
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    setIsDragPanning(true);
    setPanStart({
      x: e.clientX,
      y: e.clientY
    });
    setPanScroll({
      left: container.scrollLeft,
      top: container.scrollTop
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragPanning) return;
    const container = containerRef.current;
    if (!container) return;

    e.preventDefault();
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    
    // Apply scrolling offset
    container.scrollLeft = panScroll.left - dx;
    container.scrollTop = panScroll.top - dy;
    
    // Redraw connectors on request
    drawLines();
  };

  const handleCanvasMouseUpOrLeave = () => {
    setIsDragPanning(false);
  };

  // Calculate Family Statistics
  const treeStats = useMemo<TreeStats>(() => {
    const totalCount = members.length;
    const maleCount = members.filter(m => m.gender === "male").length;
    const femaleCount = members.filter(m => m.gender === "female").length;
    
    // Find approximate depth of generations
    const generationsList = new Set<string>();
    members.forEach(m => {
      if (m.birthYear) {
        const yr = parseInt(m.birthYear);
        if (!isNaN(yr)) {
          // Group by decade or approximate generations to find depth
          const genBucket = Math.floor(yr / 25).toString();
          generationsList.add(genBucket);
        }
      }
    });

    return {
      totalCount,
      generationsCount: generationsList.size || 3,
      maleCount,
      femaleCount: femaleCount + members.filter(m => m.gender === "other").length
    };
  }, [members]);

  // Filter members for autocomplete lookup or listing
  const filteredMembersList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return members;
    return members.filter(m => 
      m.name.toLowerCase().includes(query) ||
      (m.occupation && m.occupation.toLowerCase().includes(query)) ||
      (m.birthPlace && m.birthPlace.toLowerCase().includes(query)) ||
      (m.notes && m.notes.toLowerCase().includes(query))
    );
  }, [members, searchQuery]);

  // Track relationship categories for currently focused member
  const relatedGroup = useMemo(() => {
    if (!selectedMember) return { father: null, mother: null, spouse: null, children: [], siblings: [] };
    
    const father = members.find(m => m.id === selectedMember.fatherId) || null;
    const mother = members.find(m => m.id === selectedMember.motherId) || null;
    const spouse = members.find(m => m.id === selectedMember.spouseId) || null;

    // Children: members who list this selected's ID as fatherId OR motherId
    const children = members.filter(m => 
      m.fatherId === selectedMember.id || m.motherId === selectedMember.id
    );

    // Siblings: members who share the same father or mother, excluding self
    const siblings = members.filter(m => 
      m.id !== selectedMember.id && (
        (selectedMember.fatherId && m.fatherId === selectedMember.fatherId) ||
        (selectedMember.motherId && m.motherId === selectedMember.motherId)
      )
    );

    return { father, mother, spouse, children, siblings };
  }, [members, selectedMember]);

  // Set up values for Editing
  const startEditing = () => {
    if (!selectedMember) return;
    setEditForm({ ...selectedMember });
    setIsEditing(true);
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;

    setMembers(prev => prev.map(m => m.id === editForm.id ? { ...editForm } : m));
    setIsEditing(false);
    showToast(lang === "ur" ? "تفصیلات کامیابی سے اپ ڈیٹ ہو گئیں!" : "Member details updated successfully!");
  };

  // Helper dynamic link updates
  const handleAddNewRelative = (e: React.FormEvent) => {
    e.preventDefault();
    if (!relativeForm.name.trim() || !selectedMember) return;

    const newId = `member-${Date.now()}`;
    const newRelative: FamilyMember = {
      ...relativeForm,
      id: newId
    };

    // Configure reciprocal references based on relative type
    let updatedMembers = [...members];

    if (relativeMode === "father") {
      newRelative.gender = "male";
      // Update selected member's father point
      const updatedSelf = { ...selectedMember, fatherId: newId };
      updatedMembers = updatedMembers.map(m => m.id === selectedMember.id ? updatedSelf : m);
    } 
    else if (relativeMode === "mother") {
      newRelative.gender = "female";
      // Update selected member's mother point
      const updatedSelf = { ...selectedMember, motherId: newId };
      updatedMembers = updatedMembers.map(m => m.id === selectedMember.id ? updatedSelf : m);
    } 
    else if (relativeMode === "spouse") {
      // Connect spouse bidirectionally
      newRelative.spouseId = selectedMember.id;
      const updatedSelf = { ...selectedMember, spouseId: newId };
      updatedMembers = updatedMembers.map(m => m.id === selectedMember.id ? updatedSelf : m);
    } 
    else if (relativeMode === "child") {
      // Direct parent connection
      if (selectedMember.gender === "male") {
        newRelative.fatherId = selectedMember.id;
        // if self has spouse, register spouse as mother
        if (selectedMember.spouseId) {
          newRelative.motherId = selectedMember.spouseId;
        }
      } else {
        newRelative.motherId = selectedMember.id;
        // if self has spouse, register spouse as father
        if (selectedMember.spouseId) {
          newRelative.fatherId = selectedMember.spouseId;
        }
      }
    } 
    else if (relativeMode === "sibling") {
      // Share parents of selected member
      newRelative.fatherId = selectedMember.fatherId;
      newRelative.motherId = selectedMember.motherId;
    }

    updatedMembers.push(newRelative);
    setMembers(updatedMembers);
    setSelectedId(newId); // Focus newly created member
    setRelativeMode("none");
    setRelativeForm(defaultNewMember());
    showToast(lang === "ur" ? "نیا رشتہ دار شامل کر دیا گیا!" : "New family member added & linked successfully!");
  };

  // Add a fully separate member node to link manually later
  const handleAddSeparateMember = () => {
    const newId = `member-${Date.now()}`;
    const freshMember: FamilyMember = {
      id: newId,
      name: lang === "ur" ? "نیا ممبر" : "New Member",
      gender: "male",
      notes: "Singly added branch."
    };
    setMembers(prev => [...prev, freshMember]);
    setSelectedId(newId);
    showToast(lang === "ur" ? "نیا خالی ممبر شامل کر لیا گیا" : "Separate member created!");
  };

  // Completely delete member and purge dangling connections
  const handleDeleteMember = (idToDelete: string) => {
    if (confirm(lang === "ur" ? "کیا آپ واقعی اس ممبر کو شجرے سے حذف کرنا چاہتے ہیں؟" : "Are you sure you want to delete this family member?")) {
      setMembers(prev => {
        return prev
          .filter(m => m.id !== idToDelete)
          .map(m => {
            const copy = { ...m };
            if (copy.fatherId === idToDelete) delete copy.fatherId;
            if (copy.motherId === idToDelete) delete copy.motherId;
            if (copy.spouseId === idToDelete) delete copy.spouseId;
            return copy;
          });
      });
      showToast(lang === "ur" ? "شجرے سے ممبر حذف کر دیا گیا" : "Family member removed.");
    }
  };

  // Reset to default seed dataset
  const handleResetToSeed = () => {
    if (confirm(lang === "ur" ? "کیا آپ شجرے کو اصل نمونے پر ری سیٹ کرنا چاہتے ہیں؟" : "Do you want to reset the tree to the default demo template?")) {
      setMembers(initialFamilyMembers);
      setSelectedId(initialFamilyMembers[6]?.id || "");
      showToast(lang === "ur" ? "شجرہ کامیابی سے ری سیٹ ہو گیا!" : "Restored demo family template!");
    }
  };

  // Clear all list
  const handleClearAll = () => {
    if (confirm(lang === "ur" ? "کیا آپ سارا ڈیٹا صاف کرنا چاہتے ہیں؟" : "Are you sure you want to delete all members and start completely fresh?")) {
      setMembers([]);
      showToast(lang === "ur" ? "تمام ڈیٹا صاف کر دیا گیا" : "All family members cleared.");
    }
  };

  // Export as download file JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(members, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shajra-family-tree-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    showToast(lang === "ur" ? "فائل ڈاؤن لوڈ کے لیے تیار ہے!" : "Tree file downloaded successfully!");
  };

  // Import JSON content from user load
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setMembers(parsed);
          if (parsed.length > 0) setSelectedId(parsed[0].id);
          showToast(lang === "ur" ? "نیا ڈیٹا کامیابی سے اپلوڈ ہو گیا!" : "Family tree imported cleanly!");
        } else {
          alert("Invalid file format. Please upload valid file.");
        }
      } catch (err) {
        alert("Could not read JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // Categorize generational pools based on approximate hierarchy logic
  // Generation 1: G1 (Grandparents), Generation 2: G2 (Parents & Aunts/Uncles), Generation 3: G3 (Self, siblings, cousins)
  // Let's group dynamically by looking at who has parent links, etc.
  // Level Calculation:
  // - Members with NO parents in dataset and have grandchildren OR has children with children -> Level 1 (Grandparents)
  // - Spouse of Level 1 -> Level 1
  // - Children of Level 1 -> Level 2 (Parents generation) & spouses -> Level 2
  // - Children of Level 2 -> Level 3 (Your generation) & spouses -> Level 3
  // - Children of Level 3 -> Level 4 (Next gen)
  const generationalMap = useMemo(() => {
    const levels: Record<string, number> = {};
    
    // Step 1: Initialize everyone with level 0
    members.forEach(m => {
      levels[m.id] = 2; // default middle level
    });

    // Helper: traverse up or down to calculate relative positions
    // Let's do a smart heuristic:
    // We can count how many parent generations exist above them in the dataset
    const computedLevels = new Map<string, number>();

    const getMemberLevel = (id: string, visited = new Set<string>()): number => {
      if (visited.has(id)) return 2;
      visited.add(id);

      const m = members.find(item => item.id === id);
      if (!m) return 2;

      // Has father or mother? Level is parent level + 1
      if (m.fatherId) {
        return getMemberLevel(m.fatherId, visited) + 1;
      }
      if (m.motherId) {
        return getMemberLevel(m.motherId, visited) + 1;
      }

      // No parents? Look if they have a spouse key that already has a level computed
      // If none, default to 1 as highest senior layer
      return 1;
    };

    members.forEach(m => {
      computedLevels.set(m.id, getMemberLevel(m.id));
    });

    // Group members by their levels
    const grouped: Record<number, FamilyMember[]> = {};
    members.forEach(m => {
      const lvl = computedLevels.get(m.id) || 1;
      if (!grouped[lvl]) grouped[lvl] = [];
      grouped[lvl].push(m);
    });

    return grouped;
  }, [members]);

  const levelsSorted = useMemo(() => {
    return Object.keys(generationalMap)
      .map(Number)
      .sort((a, b) => a - b);
  }, [generationalMap]);

  // Organize generation levels into Couples and Singles
  const organizeLevel = (levelMembers: FamilyMember[]) => {
    const processed = new Set<string>();
    const result: Array<{ type: "couple" | "single"; items: FamilyMember[] }> = [];

    // First process couples
    levelMembers.forEach(m => {
      if (processed.has(m.id)) return;
      if (m.spouseId) {
        const spouse = levelMembers.find(s => s.id === m.spouseId);
        if (spouse && !processed.has(spouse.id)) {
          processed.add(m.id);
          processed.add(spouse.id);
          // Husband on left, wife on right (or male first)
          const cluster = m.gender === "male" ? [m, spouse] : [spouse, m];
          result.push({ type: "couple", items: cluster });
        }
      }
    });

    // Then add remaining singles
    levelMembers.forEach(m => {
      if (!processed.has(m.id)) {
        processed.add(m.id);
        result.push({ type: "single", items: [m] });
      }
    });

    return result;
  };

  return (
    <div 
      id="shajra-root"
      dir={lang === "ur" ? "rtl" : "ltr"} 
      className="min-h-screen bg-amber-50/20 text-slate-850 font-sans transition-all duration-300 relative flex flex-col selection:bg-amber-100"
    >
      {/* Background elegant watercolor texture or soft grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1e9db_1px,transparent_1px),linear-gradient(to_bottom,#f1e9db_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none opacity-50" />

      {/* Main Top Header Navigation */}
      <header id="shajra-header" className="bg-white/95 backdrop-blur-md border-b border-amber-200/80 sticky top-0 z-40 transition-shadow hover:shadow-xs px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 shadow-inner">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  {lang === "ur" ? "شجرہ نسب" : "Genealogy App"}
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                {lang === "ur" ? "اندازِ شجرہ - فیملی ٹری" : "Shajra-e-Nasab (Interactive Family Tree)"}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Import/Export Action triggers */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <label 
                htmlFor="import-file-upload" 
                className="p-1 px-3 text-xs font-semibold rounded-lg hover:bg-white text-slate-700 cursor-pointer transition-colors flex items-center gap-1"
                title="Upload custom family tree JSON"
              >
                <FolderUp className="w-3.5 h-3.5" />
                <span>{lang === "ur" ? "اپلوڈ" : "Import"}</span>
              </label>
              <input 
                id="import-file-upload" 
                type="file" 
                accept=".json" 
                onChange={handleImportJSON} 
                className="hidden" 
              />
              
              <button
                onClick={handleExportJSON}
                className="p-1 px-3 text-xs font-semibold rounded-lg hover:bg-white text-slate-700 cursor-pointer transition-colors flex items-center gap-1"
                title="Download current family tree model as JSON"
              >
                <FolderDown className="w-3.5 h-3.5" />
                <span>{lang === "ur" ? "ڈاؤنلوڈ" : "Export"}</span>
              </button>
            </div>

            {/* Quick Demo Template reset */}
            <button
              onClick={handleResetToSeed}
              className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset code to defaults"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              <span>{lang === "ur" ? "ری سیٹ" : "Load Preset"}</span>
            </button>

            {/* Language toggle trigger with Urdu script font fallback */}
            <button
              onClick={() => setLang(lang === "en" ? "ur" : "en")}
              className="px-4 py-1.5 text-xs font-bold rounded-xl shadow-xs transition-transform hover:scale-105 bg-slate-900 text-slate-5 cursor-pointer"
            >
              {lang === "ur" ? "View in English" : "اردو زبان"}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Status Notification Alerts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-55 bg-indigo-900 text-indigo-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-indigo-700 font-sans"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* LEFT COLUMN (Lg: col-span-4): Quick lookup, Detailed Profile Explorer & Stats Card */}
        <div id="left-sidebar" className="lg:col-span-4 space-y-6">
          
          {/* Box 1: Search & Stats */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-amber-200/60 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>{lang === "ur" ? "شجرہ کے اعداد و شمار" : "Overview & Vital Stats"}</span>
              </h3>
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {treeStats.totalCount} {lang === "ur" ? "افراد" : "Members"}
              </span>
            </div>

            {/* Quick search member field */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                aria-label="Search members"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "ur" ? "نام، جگہ یا پیشہ تلاش کریں..." : "Search members by name, occupation..."}
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-350 transition-colors font-sans"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Mini Grid counters */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                <span className="text-lg font-extrabold text-amber-900 font-mono">{treeStats.totalCount}</span>
                <span className="text-4xs text-slate-500 uppercase block font-semibold mt-1">{lang === "ur" ? "کل آبادی" : "Total Population"}</span>
              </div>
              <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/60">
                <span className="text-lg font-extrabold text-blue-900 font-mono">{treeStats.maleCount}</span>
                <span className="text-4xs text-slate-500 uppercase block font-semibold mt-1">{lang === "ur" ? "مرد" : "Males"}</span>
              </div>
              <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/60">
                <span className="text-lg font-extrabold text-rose-900 font-mono">{treeStats.femaleCount}</span>
                <span className="text-4xs text-slate-500 uppercase block font-semibold mt-1">{lang === "ur" ? "خواتین" : "Females"}</span>
              </div>
            </div>
          </div>

          {/* Box 2: Highlighted Member Showcase Details card */}
          {selectedMember ? (
            <div className="bg-white/95 rounded-3xl border-2 border-amber-200 p-6 shadow-sm relative overflow-hidden transition-all duration-300">
              <div className={`absolute top-0 left-0 right-0 h-2 ${selectedMember.gender === 'male' ? 'bg-blue-500' : 'bg-rose-500'}`} />

              <div className="flex justify-between items-start mb-4">
                <span className={`text-4xs font-mono font-extrabold px-2.5 py-1 rounded-full uppercase ${selectedMember.gender === 'male' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>
                  {selectedMember.gender === 'male' ? (lang === "ur" ? "مرد" : "MALE") : (lang === "ur" ? "کون ہے" : "FEMALE")}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={startEditing}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl transition-all cursor-pointer"
                    title={lang === "ur" ? "تفصیل تبدیل کریں" : "Edit details"}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMember(selectedMember.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                    title={lang === "ur" ? "حذف کریں" : "Delete member"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Main Body */}
              <div className="space-y-4 pt-1">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
                    {selectedMember.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-mono">
                      {selectedMember.birthYear || "???"} – {selectedMember.deathYear || (lang === "ur" ? "حیات" : "Present")}
                    </span>
                    {selectedMember.birthPlace && (
                      <>
                        <span className="text-slate-300">•</span>
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{selectedMember.birthPlace}</span>
                      </>
                    )}
                  </div>
                </div>

                {selectedMember.occupation && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium">{selectedMember.occupation}</span>
                  </div>
                )}

                {selectedMember.notes && (
                  <p className={`text-xs text-slate-600 leading-relaxed bg-amber-50/30 p-3 rounded-2xl border border-amber-100/50 italic ${lang === "ur" ? "font-serif text-right text-base" : "font-sans text-left"}`}>
                    " {selectedMember.notes} "
                  </p>
                )}

                {/* Relatives Connections list */}
                <div className="border-t border-slate-150 pt-4" id="relations-quick-view">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    {lang === "ur" ? "قریبی رشتہ دار" : "Immediate Family Connections"}
                  </h4>

                  <div className="space-y-2 text-xs">
                    {/* Father */}
                    <div className="flex items-center justify-between p-1 px-2.5 rounded-lg hover:bg-slate-50">
                      <span className="text-slate-450 font-medium">{lang === "ur" ? "والد:" : "Father:"}</span>
                      {relatedGroup.father ? (
                        <button 
                          onClick={() => setSelectedId(relatedGroup.father!.id)}
                          className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          {relatedGroup.father.name}
                        </button>
                      ) : (
                        <span className="text-slate-350 italic">{lang === "ur" ? "معلومات دستیاب نہیں" : "Not specified"}</span>
                      )}
                    </div>

                    {/* Mother */}
                    <div className="flex items-center justify-between p-1 px-2.5 rounded-lg hover:bg-slate-50">
                      <span className="text-slate-450 font-medium">{lang === "ur" ? "والدہ:" : "Mother:"}</span>
                      {relatedGroup.mother ? (
                        <button 
                          onClick={() => setSelectedId(relatedGroup.mother!.id)}
                          className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          {relatedGroup.mother.name}
                        </button>
                      ) : (
                        <span className="text-slate-350 italic">{lang === "ur" ? "معلومات دستیاب نہیں" : "Not specified"}</span>
                      )}
                    </div>

                    {/* Spouse */}
                    <div className="flex items-center justify-between p-1 px-2.5 rounded-lg hover:bg-slate-50">
                      <span className="text-slate-450 font-medium">{lang === "ur" ? "شریک حیات:" : "Spouse:"}</span>
                      {relatedGroup.spouse ? (
                        <button 
                          onClick={() => setSelectedId(relatedGroup.spouse!.id)}
                          className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          {relatedGroup.spouse.name}
                        </button>
                      ) : (
                        <span className="text-slate-350 italic">{lang === "ur" ? "شادی شدہ نہیں" : "Unmarried/Single"}</span>
                      )}
                    </div>

                    {/* Children List */}
                    <div className="p-1 px-2.5 rounded-lg">
                      <span className="text-slate-450 font-medium block mb-1">{lang === "ur" ? "بچے:" : "Children:"}</span>
                      {relatedGroup.children.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {relatedGroup.children.map(child => (
                            <button
                              key={child.id}
                              onClick={() => setSelectedId(child.id)}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-350 italic block mt-1">{lang === "ur" ? "بچے نہیں ہیں" : "No registered children"}</span>
                      )}
                    </div>

                    {/* Siblings */}
                    <div className="p-1 px-2.5 rounded-lg">
                      <span className="text-slate-450 font-medium block mb-1">{lang === "ur" ? "بہن بھائی:" : "Siblings:"}</span>
                      {relatedGroup.siblings.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {relatedGroup.siblings.map(sib => (
                            <button
                              key={sib.id}
                              onClick={() => setSelectedId(sib.id)}
                              className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-100/60 rounded-lg font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                            >
                              {sib.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-350 italic block mt-1">{lang === "ur" ? "کوئی بہن بھائی درج نہیں" : "No registered siblings"}</span>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white/90 p-6 rounded-3xl border border-amber-200/60 text-center text-slate-400">
              <span className="block mb-2">🚫</span>
              <span>{lang === "ur" ? "براہ کرم شجرے سے کوئی نام منتخب کریں" : "Please select or click on a family member to focus details."}</span>
            </div>
          )}

        </div>

        {/* CENTER INTERACTIVE WORKSPACE (Lg: col-span-8): Dynamic Generational Stage */}
        <div id="tree-canvas" className="lg:col-span-8 space-y-6">
          
          {/* Quick instructions and separate branch adding button */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200/50 p-4 shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-2xs text-slate-500 font-medium text-start">
                {lang === "ur" 
                  ? "شجرے میں کسی بھی فرد پر کلک کریں تاکہ دائیں جانب رشتہ دار شامل کر سکیں۔" 
                  : "Click any member bubble to focus, trace relationships or modify records dynamically!"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddSeparateMember}
                className="px-3.5 py-1.5 bg-slate-900 text-slate-100 border border-slate-800 rounded-xl text-2xs font-extrabold flex items-center gap-1.5 hover:bg-slate-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === "ur" ? "الگ ممبر جوڑیں" : "Add Separate Branch"}</span>
              </button>
            </div>
          </div>

          {/* Interactive Generational Grid canvas */}
          <div 
            ref={containerRef} 
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUpOrLeave}
            onMouseLeave={handleCanvasMouseUpOrLeave}
            className="bg-white/95 rounded-3xl border-2 border-amber-200/60 p-6 md:p-8 shadow-sm space-y-14 relative min-h-[580px] overflow-auto select-none cursor-grab active:cursor-grabbing max-w-full touch-pan-x touch-pan-y scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent scroll-smooth"
          >
            {/* Soft decorative visual connectors background wrapper */}
            <div className="absolute top-0 left-0 pointer-events-none z-0" id="decorative-lines">
              <svg ref={svgRef} style={{ overflow: "visible" }} />
            </div>

            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 text-center">
                <Users className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">{lang === "ur" ? "شجرہ خالی ہے" : "The family tree is empty."}</p>
                <p className="text-xs text-slate-400 mt-1">{lang === "ur" ? "شروع کرنے کے لیے پبلک سیمپل لوڈ کریں یا الگ برانچ بنائیں" : "Use the 'Load Preset' or Add Separate members to configure relations."}</p>
              </div>
            ) : (
              levelsSorted.map(level => {
                const membersAtLevel = generationalMap[level] || [];
                if (membersAtLevel.length === 0) return null;

                return (
                  <div key={level} className="space-y-4 relative z-10 min-w-max" id={`gen-row-${level}`}>
                    
                    {/* Generational Header line */}
                    <div className="flex items-center gap-2 select-none">
                      <span className="text-2xs font-extrabold font-mono tracking-widest text-slate-450 uppercase bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50">
                        {lang === "ur" 
                          ? `${level === 1 ? "پہلی نسل (دادا دادی)" : level === 2 ? "دوسری نسل (والدین)" : level === 3 ? "تیسری نسل (ہم عمر)" : `نسل ${level}`}`
                          : `Generation ${level}`}
                      </span>
                      <div className="h-px bg-slate-150 flex-1" />
                    </div>

                    {/* Organized Generation Items: Strictly horizontal, non-wrapping to maintain pedigree clarity */}
                    <div className="flex flex-row flex-nowrap gap-12 items-center justify-start sm:justify-center py-4 px-2 min-w-max">
                      {organizeLevel(membersAtLevel).map((group, groupIdx) => {
                        // Helper to render individual card to avoid code duplication
                        const renderMemberCard = (member: FamilyMember) => {
                          const isFocused = selectedId === member.id;
                          
                          // Relationship checks for highlighted borders
                          let relationBorder = "border-slate-200 shadow-xs hover:border-slate-300";
                          let relationBg = "bg-white";
                          let ringIndicator = "";
                          let badgeLabel = "";

                          if (isFocused) {
                            relationBorder = member.gender === "male" ? "border-blue-500 shadow-md" : "border-rose-500 shadow-md";
                            relationBg = "bg-white";
                            ringIndicator = "ring-4 ring-amber-400/35";
                            badgeLabel = lang === "ur" ? "منتخب" : "Selected";
                          } else if (relatedGroup.father?.id === member.id || relatedGroup.mother?.id === member.id) {
                            relationBorder = "border-indigo-400 shadow-xs hover:border-indigo-500"; // Parent
                            relationBg = "bg-indigo-50/10";
                            badgeLabel = lang === "ur" ? "والدین" : "Parent";
                          } else if (relatedGroup.spouse?.id === member.id) {
                            relationBorder = "border-rose-400 shadow-xs hover:border-rose-550"; // Spouse
                            relationBg = "bg-rose-50/10";
                            badgeLabel = lang === "ur" ? "شریک حیات" : "Spouse";
                          } else if (relatedGroup.children.some(c => c.id === member.id)) {
                            relationBorder = "border-emerald-400 shadow-xs hover:border-emerald-500"; // Child
                            relationBg = "bg-emerald-50/10";
                            badgeLabel = lang === "ur" ? "اولاد" : "Child";
                          } else if (relatedGroup.siblings.some(s => s.id === member.id)) {
                            relationBorder = "border-amber-400 shadow-xs hover:border-amber-500"; // Sibling
                            relationBg = "bg-amber-50/5";
                            badgeLabel = lang === "ur" ? "بہن بھائی" : "Sibling";
                          }

                          // Check if fit in search queries
                          const queryMatch = searchQuery ? filteredMembersList.some(item => item.id === member.id) : true;

                          return (
                            <motion.div
                              key={member.id}
                              layout
                              whileHover={{ scale: 1.05, y: -4, boxShadow: "0 12px 24px -8px rgba(0,0,0,0.08)" }}
                              whileTap={{ scale: 0.98 }}
                              id={`node-member-${member.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(member.id);
                                setIsModalOpen(true);
                              }}
                              className={`w-52 p-4 rounded-2xl border-2 transition-all cursor-pointer text-start relative select-none bg-white ${relationBorder} ${relationBg} ${ringIndicator} ${
                                !queryMatch ? "opacity-20 grayscale saturate-50 pointer-events-none" : ""
                              }`}
                            >
                              {/* Monogram profile container & micro badge */}
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black font-sans border uppercase shrink-0 ${
                                  member.gender === 'male' 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-3xs' 
                                    : 'bg-rose-50 text-rose-700 border-rose-200 shadow-3xs'
                                }`}>
                                  {member.name.trim().charAt(0) || "?"}
                                </div>

                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <h4 className="text-xs font-black text-slate-800 tracking-tight leading-snug truncate pr-1">
                                    {member.name}
                                  </h4>
                                  
                                  <p className="text-4xs font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    {member.birthYear || "???"} – {member.deathYear || (lang === "ur" ? "حیات" : "Present")}
                                  </p>
                                </div>
                              </div>

                              {member.occupation && (
                                <div className="mt-2.5 border-t border-dashed border-slate-100 pt-2 flex items-center gap-1.5 text-4xs text-slate-500 font-semibold truncate">
                                  <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{member.occupation}</span>
                                </div>
                              )}

                              {badgeLabel && (
                                <span className={`absolute -bottom-1.5 right-3 px-2 py-0.5 text-5xs font-black uppercase tracking-widest rounded-md border shadow-2xs z-20 ${
                                  isFocused 
                                    ? "bg-slate-900 text-white border-slate-800" 
                                    : badgeLabel === "Parent" || badgeLabel === "والدین" 
                                      ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                                      : badgeLabel === "Spouse" || badgeLabel === "شریک حیات" 
                                        ? "bg-rose-50 text-rose-700 border-rose-200" 
                                        : badgeLabel === "Child" || badgeLabel === "اولاد" 
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                          : "bg-amber-50 text-amber-900 border-amber-200"
                                }`}>
                                  {badgeLabel}
                                </span>
                              )}
                            </motion.div>
                          );
                        };

                        if (group.type === "couple") {
                          const [partner1, partner2] = group.items;
                          return (
                            <div 
                              key={`couple-${groupIdx}`} 
                              className="flex flex-row items-center gap-4 bg-slate-50/60 p-2.5 rounded-3xl border-2 border-dashed border-rose-150/80 shadow-3xs relative"
                            >
                              {renderMemberCard(partner1)}
                              
                              {/* Couple bridge connector */}
                              <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-200 shadow-2xs flex items-center justify-center shrink-0 z-20 -mx-2.5">
                                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                              </div>

                              {renderMemberCard(partner2)}
                            </div>
                          );
                        } else {
                          const singleMember = group.items[0];
                          return renderMemberCard(singleMember);
                        }
                      })}
                    </div>

                  </div>
                );
              })
            )}

            {/* Quick Map Legend indicator block */}
            {members.length > 0 && (
              <div className="pt-6 border-t border-slate-150/70 flex flex-col sm:flex-row justify-between items-center gap-4 text-4xs font-bold text-slate-500 uppercase tracking-wider relative z-10" id="tree-legend">
                <div className="flex flex-wrap justify-center items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-100 border border-blue-400" />
                    <span>{lang === "ur" ? "مرد ممبران" : "Males"}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-100 border border-rose-400" />
                    <span>{lang === "ur" ? "خواتین ممبران" : "Females"}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-indigo-50 border border-indigo-400" />
                    <span>{lang === "ur" ? "والدین" : "Parents"}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-400" />
                    <span>{lang === "ur" ? "اولاد" : "Children"}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-50 border border-amber-405" />
                    <span>{lang === "ur" ? "بہن بھائی" : "Siblings"}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-500">
                    <Heart className="w-3 h-3 fill-rose-500" />
                    <span>{lang === "ur" ? "شرکاء حیات" : "Spouses"}</span>
                  </span>
                </div>
                <div className="text-slate-400 lowercase italic tracking-normal font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-200/50">
                  {lang === "ur" ? "اشارہ: شجرے پر کلک کر کے کسی بھی طرف گھسیٹیں (Pan کریں)" : "Tip: Click and drag the canvas background to pan around"}
                </div>
              </div>
            )}
          </div>

          {/* LOWER SECTION: Interactive Relative Linker & Editing Forms */}
          {selectedMember && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="action-forms-panels">
              
              {/* Card A: Add Relatives dynamically linked to selected member */}
              <div className="bg-white/95 rounded-3xl border border-amber-200 p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>{lang === "ur" ? "نیا رشتہ شامل کریں" : "Add Relatives to Tree"}</span>
                  </h3>
                  <p className="text-4xs text-slate-400 mt-1 uppercase tracking-wider font-bold">
                    {lang === "ur" ? `منتخب فرد: ${selectedMember.name}` : `Linked path relative to: ${selectedMember.name}`}
                  </p>
                </div>

                {/* Relation category picker */}
                <div className="grid grid-cols-5 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-205">
                  {(["father", "mother", "spouse", "child", "sibling"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setRelativeMode(mode)}
                      className={`py-1.5 text-4xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                        relativeMode === mode 
                          ? "bg-slate-900 text-white shadow-xs" 
                          : "text-slate-450 hover:text-slate-700"
                      }`}
                    >
                      {lang === "ur" 
                        ? (mode === "father" ? "والد" : mode === "mother" ? "والدہ" : mode === "spouse" ? "شوہر/بیوی" : mode === "child" ? "بچہ" : "بہن/بھائی")
                        : mode
                      }
                    </button>
                  ))}
                </div>

                {relativeMode !== "none" ? (
                  <form onSubmit={handleAddNewRelative} className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">{lang === "ur" ? "پورا نام" : "Full Name"}</label>
                        <input
                          type="text"
                          required
                          value={relativeForm.name}
                          onChange={(e) => setRelativeForm({ ...relativeForm, name: e.target.value })}
                          placeholder={lang === "ur" ? "جیسے: محمد یاسر" : "e.g. Yasir Khan"}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-350 transition-colors"
                        />
                      </div>

                      {/* We disable gender selector if relative type has intrinsic gender (father, mother) */}
                      <div>
                        <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">{lang === "ur" ? "جنس" : "Gender"}</label>
                        <select
                          disabled={relativeMode === "father" || relativeMode === "mother"}
                          value={relativeMode === "father" ? "male" : relativeMode === "mother" ? "female" : relativeForm.gender}
                          onChange={(e) => setRelativeForm({ ...relativeForm, gender: e.target.value as "male" | "female" | "other" })}
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                        >
                          <option value="male">{lang === "ur" ? "مرد" : "Male"}</option>
                          <option value="female">{lang === "ur" ? "خواتین" : "Female"}</option>
                          <option value="other">{lang === "ur" ? "دیگر" : "Other"}</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">{lang === "ur" ? "سالِ پیدائش" : "Birth Year"}</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={relativeForm.birthYear || ""}
                          onChange={(e) => setRelativeForm({ ...relativeForm, birthYear: e.target.value })}
                          placeholder="e.g. 1970"
                          className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-350 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">{lang === "ur" ? "مقامِ پیدائش" : "Birthplace"}</label>
                        <input
                          type="text"
                          value={relativeForm.birthPlace || ""}
                          onChange={(e) => setRelativeForm({ ...relativeForm, birthPlace: e.target.value })}
                          placeholder="e.g. Lahore, Pakistan"
                          className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">{lang === "ur" ? "پیشہ / ہنر" : "Occupation"}</label>
                        <input
                          type="text"
                          value={relativeForm.occupation || ""}
                          onChange={(e) => setRelativeForm({ ...relativeForm, occupation: e.target.value })}
                          placeholder="e.g. Teacher"
                          className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">{lang === "ur" ? "اہم بات / نوٹ" : "Notes / Bio"}</label>
                        <textarea
                          rows={2}
                          value={relativeForm.notes || ""}
                          onChange={(e) => setRelativeForm({ ...relativeForm, notes: e.target.value })}
                          placeholder={lang === "ur" ? "شخصیت کے بارے میں کوئی خاص تفصیل..." : "Brief notes..."}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setRelativeMode("none")}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-650 transition-colors cursor-pointer"
                      >
                        {lang === "ur" ? "منسوخ" : "Cancel"}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white tracking-wide transition-colors cursor-pointer"
                      >
                        {lang === "ur" ? "رشتہ جوڑیں" : "Save & Connect Link"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 bg-slate-50/50">
                    <UserPlus className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
                    <p className="text-3xs font-bold uppercase tracking-wider">{lang === "ur" ? "شجرہ کے رشتے بڑھائیں" : "Build Family Tree Connections"}</p>
                    <p className="text-4xs text-slate-400 text-center mt-1 px-4">{lang === "ur" ? "اوپر موجود بٹنوں میں سے رشتہ چن کر نیا فارم کھولیں" : "Select relationship type above (Father, Mother, Child) to build node connections."}</p>
                  </div>
                )}
              </div>

              {/* Card B: Quick Member Detail Editor */}
              <div className="bg-white/95 rounded-3xl border border-amber-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-amber-600" />
                    <span>{lang === "ur" ? "تفصیل تبدیل کریں" : "Modify Member Records"}</span>
                  </h3>
                  {isEditing && (
                    <span className="text-4xs font-mono font-bold bg-amber-100/80 text-amber-900 px-2.5 py-0.5 rounded-full uppercase">
                      {lang === "ur" ? "ایڈیٹر آن" : "EDIT ACTIVE"}
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleUpdateMember} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">{lang === "ur" ? "نام" : "Name"}</label>
                        <input
                          type="text"
                          required
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-300"
                        />
                      </div>

                      <div>
                        <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">{lang === "ur" ? "جنس" : "Gender"}</label>
                        <select
                          value={editForm.gender}
                          onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as "male" | "female" | "other" })}
                          className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                        >
                          <option value="male">{lang === "ur" ? "مرد" : "Male"}</option>
                          <option value="female">{lang === "ur" ? "خواتین" : "Female"}</option>
                          <option value="other">{lang === "ur" ? "دیگر" : "Other"}</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">{lang === "ur" ? "سالِ پیدائش" : "Birth Year"}</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={editForm.birthYear || ""}
                          onChange={(e) => setEditForm({ ...editForm, birthYear: e.target.value })}
                          className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">{lang === "ur" ? "مقامِ پیدائش" : "Birthplace"}</label>
                        <input
                          type="text"
                          value={editForm.birthPlace || ""}
                          onChange={(e) => setEditForm({ ...editForm, birthPlace: e.target.value })}
                          className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">{lang === "ur" ? "سالِ وفات (اگر لاگو ہو)" : "Deceased Year (optional)"}</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={editForm.deathYear || ""}
                          onChange={(e) => setEditForm({ ...editForm, deathYear: e.target.value })}
                          placeholder="e.g. 2015"
                          className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">{lang === "ur" ? "پیشہ / ہنر" : "Occupation"}</label>
                        <input
                          type="text"
                          value={editForm.occupation || ""}
                          onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">{lang === "ur" ? "نوٹ / تاریخ" : "Bio / Biography notes"}</label>
                        <textarea
                          rows={2}
                          value={editForm.notes || ""}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-650 cursor-pointer"
                      >
                        {lang === "ur" ? "منسوخ" : "Cancel"}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
                      >
                        {lang === "ur" ? "محفوظ کریں" : "Update Records"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 bg-slate-50/50">
                    <Edit3 className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
                    <p className="text-3xs font-bold uppercase tracking-wider">{lang === "ur" ? "ریکارڈ تبدیل کریں" : "Modify Member Info"}</p>
                    <p className="text-4xs text-slate-400 text-center mt-1 px-4">{lang === "ur" ? "کسی ممبر کو منتخب کر کے اوپر موجود ایڈٹ پینل کھولیں!" : "Click 'Edit' pencil icon next to the selected member in the left card to activate manual record edits."}</p>
                    <button
                      onClick={startEditing}
                      className="mt-4 px-4 py-2 text-2xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200/50 rounded-xl transition-all cursor-pointer"
                    >
                      {lang === "ur" ? "ابھی ایڈٹ کریں" : "Activate Edit Mode"}
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </main>

      {/* Centered Popup Modal System */}
      <AnimatePresence>
        {isModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
            {/* Backdrop click close */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-default"
              onClick={() => {
                setIsModalOpen(false);
                setIsEditing(false);
                setRelativeMode("none");
              }}
            />

            {/* Modal Card container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-amber-100 w-full max-w-2xl overflow-hidden relative z-10 font-sans"
            >
              {/* Colored Gender bar */}
              <div className={`h-2.5 w-full ${selectedMember.gender === 'male' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 'bg-gradient-to-r from-rose-400 to-pink-500'}`} />

              {/* Close icon button */}
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditing(false);
                  setRelativeMode("none");
                }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title={lang === "ur" ? "بند کریں" : "Close"}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto scrollbar-thin">
                
                {/* Modal Title / Profile info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-black border-2 uppercase shrink-0 ${
                    selectedMember.gender === 'male' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedMember.name.trim().charAt(0) || "?"}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                        {selectedMember.name}
                      </h2>
                      <span className={`text-5xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        selectedMember.gender === 'male' 
                          ? 'bg-blue-550/10 text-blue-700' 
                          : 'bg-rose-550/10 text-rose-700'
                      }`}>
                        {selectedMember.gender === 'male' ? (lang === "ur" ? "مرد" : "MALE") : (lang === "ur" ? "خاتون" : "FEMALE")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-mono">
                          {selectedMember.birthYear || "???"} – {selectedMember.deathYear || (lang === "ur" ? "حیات" : "Present")}
                        </span>
                      </div>
                      {selectedMember.birthPlace && (
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{selectedMember.birthPlace}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Layout Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Left Column in popup: Profile details or edit form */}
                  <div className="space-y-5">
                    {/* Switchable edit or read profile view */}
                    {!isEditing ? (
                      <div className="space-y-4">
                        {selectedMember.occupation && (
                          <div className="space-y-1.5">
                            <h4 className="text-4xs font-bold text-slate-450 uppercase tracking-widest">
                              {lang === "ur" ? "پیشہ / ہنر" : "Occupation"}
                            </h4>
                            <div className="flex items-center gap-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <Briefcase className="w-4 h-4 text-slate-405 shrink-0" />
                              <span className="font-semibold">{selectedMember.occupation}</span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <h4 className="text-4xs font-bold text-slate-450 uppercase tracking-widest">
                            {lang === "ur" ? "حیات نامہ / نوٹ" : "Biography / Notes"}
                          </h4>
                          <div className={`p-4 rounded-2xl border bg-amber-50/20 border-amber-100/50 min-h-[90px] relative overflow-hidden ${lang === "ur" ? "text-right" : "text-left"}`}>
                            <p className={`text-xs text-slate-650 leading-relaxed italic ${lang === "ur" ? "font-serif text-base" : "font-sans"}`}>
                              {selectedMember.notes ? `"${selectedMember.notes}"` : (lang === "ur" ? "اس شخصیت کے بارے میں کوئی نوٹ درج نہیں ہے۔" : "No biography or notes registered for this active member profile.")}
                            </p>
                          </div>
                        </div>

                        {/* Direct actions inside popup */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            onClick={startEditing}
                            className="flex-1 min-w-[120px] py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            <span>{lang === "ur" ? "تفصیل تبدیل کریں" : "Edit Profile"}</span>
                          </button>

                          <button
                            onClick={() => {
                              handleDeleteMember(selectedMember.id);
                              // Auto close popup on successful deletion
                              setIsModalOpen(false);
                            }}
                            className="py-2.5 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer border border-rose-100"
                            title={lang === "ur" ? "حذف کریں" : "Delete member"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Editing Form integrated inline inside the popup! */
                      <form onSubmit={handleUpdateMember} className="space-y-3 bg-slate-50/50 border border-slate-205 p-4 rounded-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                          <span className="text-xs font-black uppercase text-slate-600">
                            {lang === "ur" ? "پروفائل ریکارڈ تبدیل کریں" : "Edit Profile Record"}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="text-5xs font-bold text-slate-450 uppercase block mb-1">{lang === "ur" ? "نام" : "Name"}</label>
                            <input
                              type="text"
                              required
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-350"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-5xs font-bold text-slate-450 uppercase block mb-1">{lang === "ur" ? "جنس" : "Gender"}</label>
                              <select
                                value={editForm.gender}
                                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as "male" | "female" | "other" })}
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                              >
                                <option value="male">{lang === "ur" ? "مرد" : "Male"}</option>
                                <option value="female">{lang === "ur" ? "خواتین" : "Female"}</option>
                                <option value="other">{lang === "ur" ? "دیگر" : "Other"}</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-5xs font-bold text-slate-450 uppercase block mb-1">{lang === "ur" ? "سالِ پیدائش" : "Birth Year"}</label>
                              <input
                                type="text"
                                maxLength={4}
                                value={editForm.birthYear || ""}
                                onChange={(e) => setEditForm({ ...editForm, birthYear: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-5xs font-bold text-slate-450 uppercase block mb-1">{lang === "ur" ? "مقامِ پیدائش" : "Birthplace"}</label>
                              <input
                                type="text"
                                value={editForm.birthPlace || ""}
                                onChange={(e) => setEditForm({ ...editForm, birthPlace: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                              />
                            </div>

                            <div>
                              <label className="text-5xs font-bold text-slate-450 uppercase block mb-1">{lang === "ur" ? "وفات کا سال (اگر لاگو ہو)" : "Deceased Year"}</label>
                              <input
                                type="text"
                                maxLength={4}
                                value={editForm.deathYear || ""}
                                onChange={(e) => setEditForm({ ...editForm, deathYear: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-5xs font-bold text-slate-450 uppercase block mb-1">{lang === "ur" ? "پیشہ / ہنر" : "Occupation"}</label>
                            <input
                              type="text"
                              value={editForm.occupation || ""}
                              onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="text-5xs font-bold text-slate-450 uppercase block mb-1">{lang === "ur" ? "اہم بات / نوٹس" : "Bio Notes"}</label>
                            <textarea
                              rows={2}
                              value={editForm.notes || ""}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden resize-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-1.5 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 text-slate-700 cursor-pointer"
                          >
                            {lang === "ur" ? "منسوخ" : "Cancel"}
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                          >
                            {lang === "ur" ? "اپ ڈیٹ" : "Save changes"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>


                  {/* Right Column in popup: Immediate connections click-to-navigate list & quick add relative */}
                  <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-6">
                    <div>
                      <h4 className="text-4xs font-bold text-slate-450 uppercase tracking-widest block mb-2.5">
                        {lang === "ur" ? "قریبی روابط کا شجرہ" : "Immediate Connections Tree"}
                      </h4>

                      {/* Display click navigables list */}
                      <div className="space-y-2 text-xs">
                        {/* Father */}
                        <div className="flex items-center justify-between p-1.5 px-2 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50">
                          <span className="text-slate-450 font-bold">{lang === "ur" ? "والد:" : "Father:"}</span>
                          {relatedGroup.father ? (
                            <button 
                              onClick={() => setSelectedId(relatedGroup.father!.id)}
                              className="font-extrabold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              {relatedGroup.father.name}
                            </button>
                          ) : (
                            <button
                              onClick={() => setRelativeMode("father")}
                              className="text-2xs font-extrabold text-amber-600 border border-dashed border-amber-200 bg-amber-50/50 hover:bg-amber-50 px-2 py-0.5 rounded cursor-pointer"
                            >
                              + {lang === "ur" ? "والد شامل کریں" : "Add Father"}
                            </button>
                          )}
                        </div>

                        {/* Mother */}
                        <div className="flex items-center justify-between p-1.5 px-2 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50">
                          <span className="text-slate-450 font-bold">{lang === "ur" ? "والدہ:" : "Mother:"}</span>
                          {relatedGroup.mother ? (
                            <button 
                              onClick={() => setSelectedId(relatedGroup.mother!.id)}
                              className="font-extrabold text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              {relatedGroup.mother.name}
                            </button>
                          ) : (
                            <button
                              onClick={() => setRelativeMode("mother")}
                              className="text-2xs font-extrabold text-amber-600 border border-dashed border-amber-200 bg-amber-50/50 hover:bg-amber-50 px-2 py-0.5 rounded cursor-pointer"
                            >
                              + {lang === "ur" ? "والدہ شامل کریں" : "Add Mother"}
                            </button>
                          )}
                        </div>

                        {/* Spouse */}
                        <div className="flex items-center justify-between p-1.5 px-2 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50">
                          <span className="text-slate-450 font-bold">{lang === "ur" ? "شریک حیات:" : "Spouse:"}</span>
                          {relatedGroup.spouse ? (
                            <button 
                              onClick={() => setSelectedId(relatedGroup.spouse!.id)}
                              className="font-extrabold text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              {relatedGroup.spouse.name}
                            </button>
                          ) : (
                            <button
                              onClick={() => setRelativeMode("spouse")}
                              className="text-2xs font-extrabold text-amber-600 border border-dashed border-amber-200 bg-amber-50/50 hover:bg-amber-50 px-2 py-0.5 rounded cursor-pointer"
                            >
                              + {lang === "ur" ? "شریک حیات" : "Add Spouse"}
                            </button>
                          )}
                        </div>

                        {/* Children List */}
                        <div className="p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-slate-450 font-bold">{lang === "ur" ? "بچے:" : "Children:"}</span>
                            <button
                              onClick={() => setRelativeMode("child")}
                              className="text-4xs font-black uppercase text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded cursor-pointer"
                            >
                              + {lang === "ur" ? "بچہ شامل کریں" : "Add Child"}
                            </button>
                          </div>
                          {relatedGroup.children.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {relatedGroup.children.map(child => (
                                <button
                                  key={child.id}
                                  onClick={() => setSelectedId(child.id)}
                                  className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 text-3xs rounded-md font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                                >
                                  {child.name}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-350 italic text-3xs block pl-1">{lang === "ur" ? "کوئی بچہ درج نہیں ہے" : "No child registered"}</span>
                          )}
                        </div>

                        {/* Sibling List */}
                        <div className="p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-slate-450 font-bold">{lang === "ur" ? "بہن بھائی:" : "Siblings:"}</span>
                            <button
                              onClick={() => setRelativeMode("sibling")}
                              className="text-4xs font-black uppercase text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded cursor-pointer"
                            >
                              + {lang === "ur" ? "بھائی/بہن" : "Add Sibling"}
                            </button>
                          </div>
                          {relatedGroup.siblings.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {relatedGroup.siblings.map(sib => (
                                <button
                                  key={sib.id}
                                  onClick={() => setSelectedId(sib.id)}
                                  className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-100/60 text-3xs rounded-md font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                                >
                                  {sib.name}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-350 italic text-3xs block pl-1">{lang === "ur" ? "کوئی بہن بھائی درج نہیں ہے" : "No siblings registered"}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Integrated Add Relative Form directly in the Popup Modal if selected! */}
                    {relativeMode !== "none" && (
                      <form onSubmit={handleAddNewRelative} className="space-y-3 bg-emerald-50/20 border border-emerald-150 p-4 rounded-2xl relative z-20">
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5 mb-2">
                          <span className="text-4xs font-black uppercase text-emerald-800">
                            {lang === "ur" ? `نیا رشتہ دار جوڑیں: ${relativeMode}` : `Add New ${relativeMode}`}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="text-5xs font-bold text-slate-450 uppercase block mb-0.5">{lang === "ur" ? "پورا نام" : "Full Name"}</label>
                            <input
                              type="text"
                              required
                              value={relativeForm.name}
                              onChange={(e) => setRelativeForm({ ...relativeForm, name: e.target.value })}
                              placeholder={lang === "ur" ? "نام درج کریں" : "Enter name"}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-5xs font-bold text-slate-450 uppercase block mb-0.5">{lang === "ur" ? "پیدائش کا سال" : "Birth Year"}</label>
                              <input
                                type="text"
                                maxLength={4}
                                value={relativeForm.birthYear || ""}
                                onChange={(e) => setRelativeForm({ ...relativeForm, birthYear: e.target.value })}
                                placeholder="e.g. 1975"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                              />
                            </div>

                            <div>
                              <label className="text-5xs font-bold text-slate-450 uppercase block mb-0.5">{lang === "ur" ? "جنس" : "Gender"}</label>
                              <select
                                disabled={relativeMode === "father" || relativeMode === "mother"}
                                value={relativeMode === "father" ? "male" : relativeMode === "mother" ? "female" : relativeForm.gender}
                                onChange={(e) => setRelativeForm({ ...relativeForm, gender: e.target.value as "male" | "female" | "other" })}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                              >
                                <option value="male">{lang === "ur" ? "مرد" : "Male"}</option>
                                <option value="female">{lang === "ur" ? "خواتین" : "Female"}</option>
                                <option value="other">{lang === "ur" ? "دیگر" : "Other"}</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1.5 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setRelativeMode("none")}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-200 text-slate-700 cursor-pointer"
                          >
                            {lang === "ur" ? "منسوخ" : "Cancel"}
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700"
                          >
                            {lang === "ur" ? "محفوظ کریں" : "Save"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer copyright space with developer info */}
      <footer id="shajra-footer" className="mt-12 bg-white border-t border-amber-100 py-6 text-center text-4xs font-mono text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>{lang === "ur" ? "شجرہ نسب مینیجر • ریموٹ فیملی رلیشنز" : "Visual Shajra Creator - Professional Genealogy Tool Kit"}</span>
          </div>
          <div>
            <span>Developed for {lang === "ur" ? "سلمان خان" : "Sulman Khan"} • 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
