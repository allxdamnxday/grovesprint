/**
 * Parse CSV content into array of objects
 * Handles common edge cases like quoted values and commas within quotes
 */
export function parseCSV(csvContent) {
  if (!csvContent || typeof csvContent !== 'string') {
    throw new Error('Invalid CSV content')
  }

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim())
  
  if (lines.length < 2) {
    throw new Error('CSV must contain headers and at least one data row')
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  
  // Validate required headers
  const requiredHeaders = ['week', 'day', 'task', 'priority']
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
  
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
  }

  // Parse data rows
  const data = []
  const errors = []
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i])
      
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`)
        continue
      }
      
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || ''
      })
      
      // Skip empty rows
      if (Object.values(row).every(v => !v)) {
        continue
      }
      
      data.push({ ...row, _rowNumber: i + 1 })
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error.message}`)
    }
  }
  
  return { data, errors, headers }
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
  const values = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last value
  values.push(current)
  
  return values
}

/**
 * Generate CSV content from array of objects
 */
export function generateCSV(data, headers) {
  if (!Array.isArray(data) || data.length === 0) {
    return ''
  }
  
  const csvHeaders = headers || Object.keys(data[0])
  const headerLine = csvHeaders.map(h => escapeCSVValue(h)).join(',')
  
  const dataLines = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header] || ''
      return escapeCSVValue(value.toString())
    }).join(',')
  })
  
  return [headerLine, ...dataLines].join('\n')
}

/**
 * Escape CSV value if it contains special characters
 */
function escapeCSVValue(value) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Create a CSV template for tasks
 */
export function createTaskCSVTemplate() {
  const template = [
    {
      week: '1',
      day: 'Day 1-2',
      task: 'Set up business structure and legal foundation',
      priority: 'high',
      status: 'pending',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Register LLC, obtain EIN, and set up business bank account'
    },
    {
      week: '1',
      day: 'Day 3-4',
      task: 'Research local funeral homes and healthcare facilities',
      priority: 'medium',
      status: 'pending',
      due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Create list of potential partners in San Diego area'
    },
    {
      week: '2',
      day: 'Day 8-9',
      task: 'Finalize product packaging and branding',
      priority: 'high',
      status: 'pending',
      due_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Work with designer on memorial-appropriate packaging'
    }
  ]
  
  const headers = ['week', 'day', 'task', 'priority', 'status', 'due_date', 'notes']
  return generateCSV(template, headers)
}