// server/src/middleware/activity.middleware.js
const { logActivity } = require('../models/Activity.model');

const logUserActivity = (action, getTarget = null, getDetails = null) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    // Override send to capture response
    res.send = function(data) {
      try {
        // Only log if request was successful (status 2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const activityData = {
            userId: req.user?._id || null,
            userEmail: req.user?.email || null,
            userName: req.user?.name || null,
            action: action,
            target: getTarget ? getTarget(req) : null,
            targetId: req.params.id || req.body?.id || null,
            details: getDetails ? getDetails(req, data) : null,
            ip: req.ip || req.connection?.remoteAddress || null,
            userAgent: req.headers['user-agent'] || null,
          };
          
          // Log asynchronously
          logActivity(activityData).catch(err => 
            console.error('Error logging activity:', err)
          );
        }
      } catch (error) {
        console.error('Activity logging error:', error);
      }
      
      // Call original send
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Pre-defined activity loggers
const activityLoggers = {
  userLogin: () => logUserActivity('User logged in'),
  
  userLogout: () => logUserActivity('User logged out'),
  
  userRegistered: () => logUserActivity('User registered'),
  
  recipeCreated: () => logUserActivity(
    'Created recipe',
    (req) => req.body?.recipeName || 'New recipe',
    (req, data) => {
      try {
        const parsed = JSON.parse(data);
        return { recipeId: parsed.recipe?._id };
      } catch {
        return null;
      }
    }
  ),
  
  recipeUpdated: () => logUserActivity(
    'Updated recipe',
    (req) => `Recipe ${req.params.id}`,
    (req) => ({ recipeId: req.params.id })
  ),
  
  recipeDeleted: () => logUserActivity(
    'Deleted recipe',
    (req) => `Recipe ${req.params.id}`,
    (req) => ({ recipeId: req.params.id })
  ),
  
  recipeLiked: () => logUserActivity(
    'Liked recipe',
    (req) => `Recipe ${req.params.id}`,
    (req) => ({ recipeId: req.params.id })
  ),
  
  recipeReported: () => logUserActivity(
    'Reported recipe',
    (req) => `Recipe ${req.params.id}`,
    (req) => ({ recipeId: req.params.id, reason: req.body?.reason })
  ),
  
  userBlocked: () => logUserActivity(
    'Blocked user',
    (req) => `User ${req.params.id}`,
    (req) => ({ userId: req.params.id })
  ),
  
  userUnblocked: () => logUserActivity(
    'Unblocked user',
    (req) => `User ${req.params.id}`,
    (req) => ({ userId: req.params.id })
  ),
  
  userRoleChanged: () => logUserActivity(
    'Changed user role',
    (req) => `User ${req.params.id} to ${req.body?.role}`,
    (req) => ({ userId: req.params.id, newRole: req.body?.role })
  ),
  
  userDeleted: () => logUserActivity(
    'Deleted user',
    (req) => `User ${req.params.id}`,
    (req) => ({ userId: req.params.id })
  ),
  
  premiumPurchased: () => logUserActivity(
    'Purchased premium membership',
    (req) => req.user?.email,
    (req) => ({ amount: 9.99 })
  ),
  
  recipePurchased: () => logUserActivity(
    'Purchased recipe',
    (req) => `Recipe ${req.body?.recipeId}`,
    (req) => ({ recipeId: req.body?.recipeId, amount: 4.99 })
  ),
};

module.exports = {
  logUserActivity,
  activityLoggers,
};