FROM nginx:alpine

# Remove default nginx website configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx reverse-proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static assets (HTML, CSS, JS) into nginx root directory
COPY . /usr/share/nginx/html/

# Expose port 80 to the outer environment
EXPOSE 80
