import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./comments.module.css";
import { getCookie } from "~/tools/getCookie";

interface Comment {
  id: string | number;
  user_name: string;
  comments: string;
  created_at: string;
}

interface CommentsSectionProps {
  identifier: string;
}

const EMOJI_SET = [
  "😀",
  "😂",
  "😍",
  "🔥",
  "👏",
  "💯",
  "🎬",
  "❤️",
  "😢",
  "😮",
  "🤔",
  "👎",
  "💀",
  "🍿",
  "⭐",
  "😱",
  "🥰",
  "👀",
  "🙌",
  "😤",
  "🎭",
];

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const CommentsSection = ({ identifier }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const canSend = inputValue.trim().length > 0 && !isSending;

  const getCurrentUsername = useCallback((): string => {
    const token = getCookie(document.cookie, "token");
    if (!token) return "User";
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.username || payload.user_name || payload.name || "User";
    } catch {
      return "User";
    }
  }, []);

  const normalizeComment = (c: any): Comment => ({
    id: c.id || c.comment_id || c.uuid || String(Math.random()),
    user_name: c.user_name || c.username || c.userName || "Unknown",
    comments: c.comments || c.comment || c.text || c.body || "",
    created_at: c.created_at || c.createdAt || c.timestamp || "",
  });

  const fetchComments = useCallback(
    async (page: number = 1, append: boolean = false) => {
      const accessToken = getCookie(document.cookie, "token");
      if (!accessToken) {
        setFetchError("Not authenticated");
        setIsLoading(false);
        return;
      }

      try {
        setFetchError(null);
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        const res = await fetch(
          `${API_BASE}/api/stream/comments?identifier="${identifier}"&page=${page}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to load comments (${res.status})`);
        }

        const data = await res.json();
        console.log("Comments API response (page " + page + "):", data);

        const rawList: any[] =
          data.results ||
          data.comments ||
          data.data ||
          (Array.isArray(data) ? data : []);
        const normalized = rawList.map(normalizeComment);

        const total = data.total_items ?? normalized.length;
        const pageSize = data.page_size ?? normalized.length;

        setTotalItems(total);
        setCurrentPage(page);
        setHasMore(page * pageSize < total);

        if (append) {
          setComments((prev) => [...prev, ...normalized]);
        } else {
          setComments(normalized);
        }
      } catch (err: any) {
        console.error("Failed to fetch comments:", err);
        setFetchError(err.message || "Could not load comments");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [identifier]
  );

  useEffect(() => {
    fetchComments(1, false);
  }, [fetchComments]);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    if (showEmoji) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showEmoji]);

  const handleInput = (val: string) => {
    setInputValue(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    const accessToken = getCookie(document.cookie, "token");
    if (!accessToken) return;

    const commentText = inputValue.trim();
    const username = getCurrentUsername();

    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setIsSending(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/stream/comments?identifier="${identifier}"&page=1`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            movie_id: identifier,
            comments: commentText,
            user_name: username,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to post comment");
      }

      await fetchComments(1, false);
    } catch (err) {
      console.error("Failed to post comment:", err);
      setInputValue(commentText);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  const currentUsername = getCurrentUsername();

  return (
    <div className={styles.commentsSection}>
      <div className={styles.commentsHeader}>
        <div className={styles.headerTitleWrap}>
          <h3 className={styles.commentsTitle}>Comments</h3>
          <span className={styles.commentCount}>
            {isLoading ? "..." : totalItems || comments.length}
          </span>
        </div>
      </div>

      <div className={styles.composeContainer}>
        <div className={styles.composeHeader}>
          <div className={styles.userProfileGroup}>
            <div className={styles.currentUserAvatar}>
              {getInitials(currentUsername)}
            </div>
            <div className={styles.currentuserInfo}>
              <span className={styles.currentUserName}>{currentUsername}</span>
              <span className={styles.currentUserBadge}>Public comment</span>
            </div>
          </div>
        </div>

        <div className={styles.composeCard}>
          <textarea
            ref={textareaRef}
            className={styles.commentInput}
            placeholder="Share your thoughts about this movie..."
            value={inputValue}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isSending}
          />

          <div className={styles.composeToolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.emojiAnchor} ref={emojiRef}>
                <button
                  type="button"
                  onClick={() => setShowEmoji((v) => !v)}
                  className={styles.emojiBtn}
                  aria-label="Add emoji"
                  title="Insert emoji"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                  <span className={styles.emojiBtnLabel}>Emoji</span>
                </button>

                {showEmoji && (
                  <div className={styles.emojiPicker}>
                    {EMOJI_SET.map((emoji) => (
                      <button
                        key={emoji}
                        className={styles.emojiOption}
                        onClick={() => insertEmoji(emoji)}
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.toolbarRight}>
              <button
                className={`${styles.sendBtn} ${
                  canSend ? styles.sendBtnActive : ""
                }`}
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send comment"
                type="button"
              >
                <span>{isSending ? "Posting..." : "Comment"}</span>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className={styles.loadingState}>
          <div className={styles.loadingDots}>
            <span />
            <span />
            <span />
          </div>
          <p>Loading comments...</p>
        </div>
      )}

      {fetchError && !isLoading && (
        <div className={styles.errorState}>
          <p>{fetchError}</p>
          <button
            className={styles.retryBtn}
            onClick={() => {
              setIsLoading(true);
              fetchComments(1, false);
            }}
            type="button"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !fetchError && comments.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <p className={styles.emptyText}>No comments yet</p>
          <p className={styles.emptySubtext}>
            Be the first to share your thoughts
          </p>
        </div>
      )}

      {!isLoading && !fetchError && comments.length > 0 && (
        <>
          <div className={styles.commentsList}>
            {comments.map((c, idx) => {
              const isOwn = c.user_name === currentUsername;
              return (
                <div
                  key={c.id}
                  className={styles.commentItem}
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className={styles.commentAvatar}>
                    {getInitials(c.user_name)}
                  </div>
                  <div className={styles.commentContent}>
                    <div className={styles.commentHeader}>
                      <div className={styles.commentMeta}>
                        <span className={styles.commentAuthor}>
                          {c.user_name}
                        </span>
                        {isOwn && <span className={styles.ownBadge}>You</span>}
                      </div>
                    </div>
                    <p className={styles.commentText}>{c.comments}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <button
              className={styles.viewMoreBtn}
              onClick={() => fetchComments(currentPage + 1, true)}
              disabled={isLoadingMore}
              type="button"
            >
              <span>
                {isLoadingMore
                  ? "Loading..."
                  : `View ${Math.max(
                      0,
                      totalItems - comments.length
                    )} more comment${
                      Math.max(0, totalItems - comments.length) > 1 ? "s" : ""
                    }`}
              </span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default CommentsSection;
