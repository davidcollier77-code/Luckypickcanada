with open("memory-bank/activeContext.md", "r") as f:
    content = f.read()

bad_line = "- **Remaining Work:** None for this specific task."
good_line = "- **Remaining Work:** None for this specific task.\n\n- **Recent Task:** Community Map Mobile Usability and Visual Clarity\n- **Findings:** The All-Time / Last 24 Hours buttons lacked enough contrast when inactive, taking up too much vertical real-estate on mobile. There was no obvious call to action to read full stories from the cards below the map. 0-count map markers remained visible even when the 'Last 24 Hours' view had no stories, which was visually noisy.\n- **Actions Taken:** Added explicit active/inactive backgrounds and borders for timeframe buttons. Reduced mobile padding for statistics in map.css. Appended a \"Read full story ->\" link for story cards. Conditionally hid empty map markers if no stories are present.\n- **Remaining Work:** None."

# Guard against duplicate entries - only replace if the task block doesn't already exist
if "Community Map Mobile Usability and Visual Clarity" not in content:
    content = content.replace(bad_line, good_line, 1)

with open("memory-bank/activeContext.md", "w") as f:
    f.write(content)
