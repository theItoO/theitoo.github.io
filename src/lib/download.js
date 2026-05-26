import JSZip from 'jszip'

const BASE = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}template/xyz.kumaraswamy.itoo`

const TEMPLATE_FILES = [
  { zipPath: 'xyz.kumaraswamy.itoo/aiwebres/icon.png',      url: `${BASE}/aiwebres/icon.png`,      binary: true  },
  { zipPath: 'xyz.kumaraswamy.itoo/components.json',         url: `${BASE}/components.json`,         binary: false },
  { zipPath: 'xyz.kumaraswamy.itoo/files/AndroidRuntime.jar',url: `${BASE}/files/AndroidRuntime.jar`,binary: true  },
  { zipPath: 'xyz.kumaraswamy.itoo/classes.jar',             url: `${BASE}/classes.jar`,             binary: true  },
  { zipPath: 'xyz.kumaraswamy.itoo/extension.properties',    url: `${BASE}/extension.properties`,    binary: false },
]

export async function downloadAix(componentBuildInfos) {
  const zip = new JSZip()

  await Promise.all(TEMPLATE_FILES.map(async ({ zipPath, url, binary }) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch template file: ${url}`)
    zip.file(zipPath, binary ? await res.arrayBuffer() : await res.text())
  }))

  zip.file(
    'xyz.kumaraswamy.itoo/files/component_build_infos.json',
    JSON.stringify(componentBuildInfos)
  )

  const blob = await zip.generateAsync({ type: 'blob' })
  const href = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href, download: 'xyz.kumaraswamy.itoo.aix' })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(href)
}
