import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../utils/api';
import type { Post } from '../../utils/types';
import { 
  Heart, 
  Image,
  Loader2,
  Send,
  Info
} from 'lucide-react';
import { slideInLeft } from '../ui/animationConstants';
import styles from './CommunityFeed.module.css';

export default function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostUrl, setNewPostUrl] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const data = await api.getPosts();
        setPosts(data);
      } catch (err) {
        setError('Failed to load posts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostUrl.trim()) return;

    setSubmitting(true);
    try {
      const post = await api.createPost({
        image_url: newPostUrl,
        caption: newPostCaption,
      });
      setPosts([post, ...posts]);
      setNewPostUrl('');
      setNewPostCaption('');
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const result = await api.likePost(postId);
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, likes_count: result.likes_count } : p
      ));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  if (loading) {
    return (
      <motion.div 
        className={styles.community}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div 
          className={styles.createPost}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>Share Your Support</h3>
          <div className={styles.loadingContainer}>
            <Loader2 className={styles.spinning} size={24} />
            <p>Loading community posts...</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={styles.community}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className={styles.createPost}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3>Share Your Support</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <motion.div 
            className={styles.inputWrapper}
            whileFocusWithin={{ scale: 1.01 }}
          >
            <Image size={18} className={styles.inputIcon} />
            <input
              type="url"
              placeholder="Image URL (paste a photo URL)"
              value={newPostUrl}
              onChange={(e) => setNewPostUrl(e.target.value)}
              className={styles.input}
              required
            />
          </motion.div>
          <motion.div 
            className={styles.textareaWrapper}
            whileFocusWithin={{ scale: 1.01 }}
          >
            <textarea
              placeholder="Add a caption... (optional)"
              value={newPostCaption}
              onChange={(e) => setNewPostCaption(e.target.value)}
              className={styles.textarea}
              rows={2}
            />
          </motion.div>
          <motion.button 
            type="submit" 
            className={styles.submitBtn}
            disabled={submitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {submitting ? (
              <>
                <Loader2 className={styles.spinning} size={16} />
                Posting...
              </>
            ) : (
              <>
                <Send size={16} />
                Share Post
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      <motion.div 
        className={styles.posts}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3>Community Posts</h3>
        {posts.length === 0 ? (
          <motion.div 
            className={styles.empty}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Info size={32} className={styles.emptyIcon} />
            <p>No posts yet. Be the first to share your support!</p>
          </motion.div>
        ) : (
          <div className={styles.postsGrid}>
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div 
                  key={post.id} 
                  className={styles.postCard}
                  variants={slideInLeft}
                  initial="initial"
                  animate="animate"
                  custom={index}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  <div className={styles.postImage}>
                    <img src={post.image_url} alt={post.caption || 'Community post'} />
                  </div>
                  <div className={styles.postContent}>
                    <p className={styles.caption}>{post.caption || 'No caption'}</p>
                    <div className={styles.postMeta}>
                      <span className={styles.author}>@{post.author.username}</span>
                      <motion.button 
                        className={styles.likeBtn}
                        onClick={() => handleLike(post.id)}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Heart size={14} />
                        {post.likes_count}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
