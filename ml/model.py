import numpy as np

class PureNumpyDecisionTree:
    def __init__(self, max_depth=5):
        self.max_depth = max_depth
        self.tree = None
        self.feature_importances_ = None

    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.feature_importances_ = np.zeros(n_features)
        self.tree = self._build_tree(X, y, depth=0)
        total_imp = np.sum(self.feature_importances_)
        if total_imp > 0:
            self.feature_importances_ /= total_imp

    def _build_tree(self, X, y, depth):
        n_samples, n_features = X.shape
        if depth >= self.max_depth or len(np.unique(y)) <= 1 or n_samples < 4:
            return {"leaf": True, "value": float(np.mean(y))}

        best_gain = -1.0
        best_feat = None
        best_thresh = None

        current_variance = np.var(y)

        for feat in range(n_features):
            thresholds = np.percentile(X[:, feat], [25, 50, 75])
            for thresh in thresholds:
                left_mask = X[:, feat] <= thresh
                right_mask = ~left_mask
                if np.sum(left_mask) < 2 or np.sum(right_mask) < 2:
                    continue

                var_left = np.var(y[left_mask])
                var_right = np.var(y[right_mask])
                weighted_var = (np.sum(left_mask) * var_left + np.sum(right_mask) * var_right) / n_samples
                gain = current_variance - weighted_var

                if gain > best_gain:
                    best_gain = gain
                    best_feat = feat
                    best_thresh = thresh

        if best_gain <= 0 or best_feat is None:
            return {"leaf": True, "value": float(np.mean(y))}

        self.feature_importances_[best_feat] += best_gain * n_samples

        left_mask = X[:, best_feat] <= best_thresh
        right_mask = ~left_mask

        return {
            "leaf": False,
            "feature": best_feat,
            "threshold": float(best_thresh),
            "left": self._build_tree(X[left_mask], y[left_mask], depth + 1),
            "right": self._build_tree(X[right_mask], y[right_mask], depth + 1),
        }

    def predict_proba(self, X):
        probs = np.array([self._predict_row(self.tree, row) for row in X])
        return np.column_stack([1 - probs, probs])

    def predict(self, X):
        probs = self.predict_proba(X)[:, 1]
        return (probs >= 0.5).astype(int)

    def _predict_row(self, node, row):
        if node["leaf"]:
            return node["value"]
        if row[node["feature"]] <= node["threshold"]:
            return self._predict_row(node["left"], row)
        return self._predict_row(node["right"], row)
