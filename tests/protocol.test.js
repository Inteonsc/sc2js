import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'

const protocol = JSON.parse(
  readFileSync('./vendor/s2protocol/json/protocol95299.json', 'utf8')
)

const tracker = protocol.modules[0].decls
  .find(d => d.fullname === 'NNet.Replay')
  .decls.find(d => d.fullname === 'NNet.Replay.Tracker')

describe('protocol definitions', () => {

  test('loads successfully', () => {
    expect(protocol.modules).toBeDefined()
  })

  test('has tracker events', () => {
    expect(tracker).toBeDefined()
    expect(tracker.decls.length).toBe(15)
  })

  test('SUnitBornEvent has expected fields', () => {
    const unitBorn = tracker.decls.find(d => d.name === 'SUnitBornEvent')
    const fields = unitBorn.type_info.fields.filter(f => f.type === 'MemberStructField')
    
    const tags = Object.fromEntries(fields.map(f => [f.tag.value, f.name]))
    
    expect(tags['0']).toBe('m_unitTagIndex')
    expect(tags['2']).toBe('m_unitTypeName')
    expect(tags['3']).toBe('m_controlPlayerId')
    expect(tags['5']).toBe('m_x')
    expect(tags['6']).toBe('m_y')
  })

})