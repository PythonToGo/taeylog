#!/usr/bin/env bash
#
# Test GitHub Pages deployment locally
# This script simulates the GitHub Actions workflow to verify deployment readiness
#
# Usage: bash tools/test-deploy.sh

set -eu

SITE_DIR="_site"
CONFIG="_config.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    echo_info "Checking dependencies..."
    
    if ! command -v bundle &> /dev/null; then
        echo_error "bundle is not installed. Please install Ruby and Bundler."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        echo_error "git is not installed."
        exit 1
    fi
    
    echo_info "All dependencies are installed."
}

# Check if bundle is installed
check_bundle() {
    echo_info "Checking if dependencies are installed..."
    
    # Configure bundle to install gems locally (avoid permission issues)
    bundle config set --local path 'vendor/bundle' 2>/dev/null || true
    
    if ! bundle check &> /dev/null; then
        echo_warn "Dependencies are not installed. Running 'bundle install'..."
        bundle install --path vendor/bundle
    fi
}

# Get base_path (simulating GitHub Pages base_path)
# For user/organization pages, base_path is usually empty
# For project pages, it would be /repo-name
get_base_path() {
    # Check if this is a project page (has baseurl set)
    local baseurl=$(grep '^baseurl:' "$CONFIG" | sed "s/.*: *//;s/['\"]//g;s/#.*//" | xargs)
    
    if [[ -n "$baseurl" && "$baseurl" != "" ]]; then
        echo "$baseurl"
    else
        echo ""
    fi
}

# Clean previous build
clean_build() {
    echo_info "Cleaning previous build..."
    if [[ -d "$SITE_DIR" ]]; then
        rm -rf "$SITE_DIR"
    fi
}

# Build site (matching GitHub Actions)
build_site() {
    echo_info "Building site (production mode)..."
    
    local base_path=$(get_base_path)
    local build_dir="${SITE_DIR}${base_path}"
    
    echo_info "Build directory: $build_dir"
    
    JEKYLL_ENV=production bundle exec jekyll b -d "$build_dir"
    
    if [[ $? -ne 0 ]]; then
        echo_error "Build failed!"
        exit 1
    fi
    
    echo_info "Build completed successfully."
}

# Test site with htmlproofer (matching GitHub Actions)
test_site() {
    echo_info "Testing site with htmlproofer..."
    
    local base_path=$(get_base_path)
    local test_dir="${SITE_DIR}${base_path}"
    
    # Use the same options as GitHub Actions workflow
    # Note: htmlproofer 5.x uses --ignore-empty-alt instead of --empty-alt-ignore
    # and --url-ignore is replaced by --ignore-urls with all patterns
    bundle exec htmlproofer "$test_dir" \
        --disable-external \
        --ignore-urls "/^http:\/\/127.0.0.1/,/^http:\/\/0.0.0.0/,/^http:\/\/localhost/,/#/,/^\/$/,/^mailto:/" \
        --allow-hash-href \
        --ignore-empty-alt
    
    if [[ $? -ne 0 ]]; then
        echo_error "HTML validation failed!"
        exit 1
    fi
    
    echo_info "HTML validation passed."
}

# Check for common issues
check_config() {
    echo_info "Checking configuration..."
    
    local issues=0
    
    # Check for placeholder URLs
    if grep -q "github.com/username" "$CONFIG" 2>/dev/null; then
        echo_warn "Found placeholder GitHub URL in _config.yml"
        issues=$((issues + 1))
    fi
    
    if grep -q "linkedin.com/in/username" "$CONFIG" 2>/dev/null; then
        echo_warn "Found placeholder LinkedIn URL in _config.yml"
        issues=$((issues + 1))
    fi
    
    # Check if url is set
    if ! grep -q "^url:" "$CONFIG" 2>/dev/null; then
        echo_warn "URL not set in _config.yml"
        issues=$((issues + 1))
    fi
    
    if [[ $issues -eq 0 ]]; then
        echo_info "Configuration looks good."
    else
        echo_warn "Found $issues potential configuration issue(s)."
    fi
}

# Main execution
main() {
    echo_info "Starting GitHub Pages deployment test..."
    echo ""
    
    check_dependencies
    check_bundle
    check_config
    echo ""
    
    clean_build
    build_site
    echo ""
    
    test_site
    echo ""
    
    echo_info "========================================="
    echo_info "✓ All tests passed!"
    echo_info "Your site is ready for GitHub Pages deployment."
    echo_info "========================================="
}

# Run main function
main

