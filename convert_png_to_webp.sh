# #!/bin/bash

# # Directory containing the images
# IMAGE_DIR="./src/assets/work-tab"  # Change this to your image directory

# # Find all PNG files in the directory
# find "$IMAGE_DIR" -type f -name "*.png" | while read -r file; do
#   # Get the filename without extension
#   filename=$(basename "$file" .png)

#   # Get the directory of the file
#   directory=$(dirname "$file")

#   # Convert the file to webp format
#   cwebp -q 80 "$file" -o "$directory/$filename.webp"

#   echo "Converted $file to $directory/$filename.webp"
# done

# echo "All PNG files have been converted to WebP!"


#!/bin/bash

# Directory containing the images
IMAGE_DIR="./src/assets"  # Change this to your image directory

# Find and delete all PNG files in the directory
find "$IMAGE_DIR" -type f -name "*.png" -exec rm -f {} \;

echo "All PNG files in $IMAGE_DIR have been deleted!"
