# ItemTracker - User Guide & Documentation

**ItemTracker** is a professional inventory management system for any business. Track items, quantities, weights, and metrics with ease. Works offline, no account needed, fully private.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Core Concepts](#core-concepts)
3. [Using ItemTracker](#using-itemtracker)
4. [Customization](#customization)
5. [Analytics & Charts](#analytics--charts)
6. [Export & Reports](#export--reports)
7. [Data Management](#data-management)
8. [Mobile & PWA](#mobile--pwa)
9. [Tips & Examples](#tips--examples)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

**Option 1: Web Browser**
1. Open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge)
2. Bookmark for quick access

**Option 2: Progressive Web App (PWA)**
1. Open in browser
2. Click menu (⋮) → "Install ItemTracker"
3. Appears on your home screen like a native app
4. Works offline after installation

### First Time Use

1. **Welcome**: You'll see the main dashboard
2. **Add Party**: Click the + button to create your first party (e.g., "Client A", "Store 1")
3. **Add Month**: Select the party, then click + to add a time period
4. **Add Category**: Select month, click + to add a category/type
5. **Add Entry**: Select category, click + to record quantity/weight
6. **View Analytics**: Click 📊 button to see summaries and trends

---

## Core Concepts

ItemTracker organizes data hierarchically:

```
PARTY (e.g., Client, Store, Brand)
  ├─ MONTH (e.g., January, Week 1, Season 1)
  │   ├─ SIZE (e.g., Small, Red, Premium)
  │   │   ├─ Entry 1: 10 pieces, 500g
  │   │   ├─ Entry 2: 15 pieces, 750g
  │   │   └─ Entry 3: 20 pieces, 1000g
  │   └─ SIZE 2
  │       └─ Entry: 5 pieces, 250g
  └─ MONTH 2
```

### Field Names

Each level is customizable:

| Default | What It Means | Customizable |
|---------|---------------|--------------|
| **Party** | Primary grouping | Client, Store, Supplier, Brand |
| **Month** | Secondary grouping | Month, Week, Season, Batch, Delivery |
| **Size** | Category/Type | Size, Color, Style, Product, Grade |
| **Pieces** | Quantity unit | Units, Items, Boxes, Kilos, Hours |
| **Grams** | Weight unit | Grams, KG, Pounds, Liters, Miles |

---

## Using ItemTracker

### Adding a Party

1. Click the **+ button** in the header (or on Party screen)
2. Enter name (e.g., "Shubham", "Fancy Store", "Brand X")
3. Click **Save**
4. Party appears in list with total statistics

### Adding a Month

1. **Select a party** by tapping it
2. Click the **+ button** under that party
3. Enter month/period name (e.g., "January", "Week 1", "Batch A")
4. Click **Save**
5. Month appears under the party

### Adding a Size/Category

1. **Select month** by tapping it
2. Click the **+ button**
3. Enter size/category name (e.g., "Small", "Red", "Premium")
4. Click **Save**
5. Category under that month

### Recording an Entry

1. **Select size/category**
2. Click **+ entry** button
3. Enter:
   - **Pieces**: Quantity (number of items)
   - **Grams**: Weight or second metric
4. Click **Save**
5. Entry counted in totals immediately

### Editing Data

- **Tap party/month/size/entry** to select
- Click **Edit** button (pencil icon)
- Modify name or values
- Click **Save**

### Deleting Data

- **Select item** to delete
- Swipe left (mobile) or click **Delete** button
- Confirm deletion
- ⚠️ **Deletion is permanent**

---

## Customization

### Customize Field Names

**Why?** Make ItemTracker match your business vocabulary.

1. Click **Customize Fields** button (🛡️ shield icon) in header
2. Change field names:
   - Party: `Client` (instead of "Party")
   - Month: `Batch` (instead of "Month")
   - Size: `Product` (instead of "Size")
   - Quantity: `Units` (instead of "Pieces")
   - Weight: `KG` (instead of "Grams")
3. Click **Save**
4. Entire app updates with new terminology

### Real-World Examples

#### Example 1: Textile/Laundry Business
```
- Party: "Party" (client names)
- Month: "Month" (Jan, Feb, Mar...)
- Size: "Size" (S, M, L, XL)
- Quantity: "Pieces"
- Weight: "Grams"
```

#### Example 2: Retail Store
```
- Party: "Store" (location names)
- Month: "Month"
- Size: "Product" (shirt, pants, shoes...)
- Quantity: "Units"
- Weight: "KG"
```

#### Example 3: Equipment Rental
```
- Party: "Client" (customer names)
- Month: "Rental" (rental period)
- Size: "Equipment" (camera, mic, light...)
- Quantity: "Items"
- Weight: "Hours" (usage hours)
```

#### Example 4: Food Distribution
```
- Party: "Supplier" (distributor names)
- Month: "Delivery" (delivery date)
- Size: "Item" (apple, orange, banana...)
- Quantity: "Boxes"
- Weight: "KG"
```

---

## Analytics & Charts

### View Analytics Dashboard

Click **Analytics** button (📊) to see:

- **Total Summary**: Parties, entries, total pieces, total weight
- **Top Parties**: Which parties have most inventory
- **Busiest Month**: When you had peak activity
- **Total Entries**: How many records exist
- **Average Weight per Piece**
- **Largest Entry**: Single entry with most quantity

### Generate Charts

Click **Charts** button (📈) to visualize:

1. **Inventory by Party**: Bar chart comparing all parties
2. **Cumulative Trend**: Line chart showing growth over time

**Tips:**
- Charts auto-update when you add data
- You can analyze trends visually
- Export chart images for reports

---

## Export & Reports

### Export Options

Click **Export** button (⬇️ down arrow) to choose:

#### 1. Export All Data to Excel
- Complete spreadsheet with all information
- Summary sheet + per-party sheets
- Organized by Party → Month → Size → Entry
- Best for: Complete inventory review

#### 2. Export All Data to PDF
- Professional report format
- Summary page with statistics
- Party overview table
- Best for: Sharing with stakeholders, printing

#### 3. Export Party to Excel
- Select a specific party
- Details of that party's inventory
- Month-wise breakdown with all sizes
- Best for: Single party analysis

#### 4. Export Party to PDF
- Professional report for one party
- Detailed month-by-month breakdown
- Graphics and statistics
- Best for: Client reports, archives

#### 5. Export Size to Excel
- Entry-level details for a specific size
- All individual entries with stats
- Best for: Quality assurance, audits

#### 6. Export Size to PDF
- Detailed PDF of specific size/category
- Entry-by-entry breakdown
- Statistics and charts
- Best for: Detailed reports

### Using Exported Files

**Excel Files:**
- Open in Excel, Google Sheets, Numbers
- Create pivot tables
- Add formulas
- Share via email
- Analyze further

**PDF Files:**
- Print for records
- Email to clients
- Archive for compliance
- Share read-only

---

## Data Management

### Backup Your Data

**Why?** Protect against accidental loss or device change.

1. Open **Settings** (⚙️ gear icon)
2. Click **Backup Data**
3. A JSON file automatically downloads
4. Name it (e.g., "ItemTracker_Backup_2024")
5. Store safely (email, cloud, USB drive)

### Restore Your Data

**Scenario:** You switched devices, lost data, or want to restore.

1. Open **Settings**
2. Click **Restore Data**
3. Select your backup JSON file
4. Confirm
5. All data restored immediately

### Understanding Backups

- **Format**: JSON (human-readable text)
- **Size**: Usually 5-50 KB (very small)
- **Security**: Complete data snapshot
- **Restore**: Works on any device with ItemTracker

---

## Mobile & PWA

### Install as App

**iPhone/iPad:**
1. Open Safari
2. Go to ItemTracker
3. Click Share → "Add to Home Screen"
4. Appears like a native app

**Android:**
1. Open Chrome/Firefox
2. Go to ItemTracker
3. Click Menu (⋮) → "Install app"
4. Appears on home screen

### Offline Mode

- ✅ Use without internet
- ✅ All data works offline
- ✅ Syncs when online
- ✅ No data loss

### Mobile Optimization

- Responsive design (works all screen sizes)
- Touch-friendly buttons
- Portrait & landscape support
- Safe area respect (notches, home indicator)

---

## Tips & Examples

### Best Practices

1. **Use Clear Names**: "Client A" is better than "A"
2. **Consistent Categories**: Use same size names consistently
3. **Regular Export**: Backup weekly or monthly
4. **Monitor Trends**: Check analytics regularly
5. **Clean Up**: Archive completed periods

### Workflow Examples

#### Daily Laundry Tracking
```
1. Morning: Add empty entry for daily count
2. Throughout day: Update with new batches
3. Evening: Export for client report
4. Weekly: Backup data, review trends
```

#### Retail Inventory
```
1. Start of month: Create new month record
2. Daily: Record sales by product
3. Week-end: Export and review
4. Month-end: Generate report, start new month
```

#### Equipment Management
```
1. Before rental: Create entry with checklist
2. During: Update hours used
3. After: Mark complete, export record
4. Audit: Run quarterly analysis
```

---

## Troubleshooting

### Common Issues

#### "Data not saving"
- ✅ Check browser's localStorage isn't disabled
- ✅ Refresh page and try again
- ✅ Check device storage space
- ✅ Try another browser

#### "Charts not showing"
- ✅ Make sure you have data entered
- ✅ Close and reopen charts modal
- ✅ Update browser to latest version
- ✅ Clear browser cache

#### "Export not working"
- ✅ Ensure at least one entry exists
- ✅ Try different export format
- ✅ Check browser console (F12 → Console)
- ✅ Try another browser

#### "PDF generation hanging"
- ✅ Reduce number of entries
- ✅ Export specific party instead of all
- ✅ Try Excel export instead
- ✅ Close other tabs/apps

#### "Can't restore backup"
- ✅ Make sure file is JSON format
- ✅ File isn't corrupted
- ✅ Try in different browser
- ✅ Check for backup file corruption

### Browser Requirements

- **Minimum**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Recommended**: Latest version of any modern browser
- **Mobile**: iOS 11+, Android 6+

### Privacy & Security

✅ **All data stored locally** on your device  
✅ **No cloud upload** - complete privacy  
✅ **No account needed** - just use  
✅ **No tracking** - fully private  
✅ **No ads** - clean experience  

---

## Advanced Features

### Search

Click **Settings** then **Advanced Search** to find:
- Items by name
- Items by metric
- Date range filtering
- Quick navigation

### Dark Mode

In **Settings**, toggle **Dark Mode** for:
- Comfortable night viewing
- Reduced eye strain
- Battery saving (OLED devices)

### Import/Export

Use backup/restore for:
- Device migration
- Team sharing (via file)
- Data archiving
- Compliance records

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Escape` | Close modal |
| `Enter` | Save in modal |
| `Tab` | Next input field |
| `Shift+Tab` | Previous input field |

---

## FAQ

**Q: Is my data safe?**  
A: Yes. All data stored locally on your device. Not sent anywhere.

**Q: Can I use on multiple devices?**  
A: Yes. Export from one device, restore on another.

**Q: Can I share with team members?**  
A: Yes. Export the data file and share with others.

**Q: What if I lose my device?**  
A: Use your backup to restore on new device.

**Q: Can I edit exported files?**  
A: Yes. Edit Excel files, but restore original JSON format to reimport.

**Q: Is there a desktop version?**  
A: Works on any browser - no special version needed.

**Q: Can it handle large amounts of data?**  
A: Yes, tested up to 10,000+ entries.

---

## Support & Feedback

For questions or issues:
1. Check this guide and troubleshooting section
2. Try clearing cache and reloading
3. Test in different browser
4. Document issue and contact support

---

## Version History

- **v1.5.0** - ItemTracker rebranding, customizable fields, charts
- **v1.4.0** - Advanced features added (search, backup, dark mode)
- **v1.3.0** - Professional exports (PDF & Excel)
- **v1.0.0** - Initial release

---

**Enjoy using ItemTracker! 📦**
