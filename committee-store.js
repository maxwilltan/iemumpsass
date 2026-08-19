(function () {
  const departments = [
    { id: 'civil', name: 'Civil Engineering', icon: 'CE', order: 1 },
    { id: 'chemical', name: 'Chemical Engineering', icon: 'CH', order: 2 },
    { id: 'mechanical', name: 'Mechanical & Mechatronic Engineering', icon: 'ME', order: 3 },
    { id: 'electrical', name: 'Electrical & Electronics Engineering', icon: 'EE', order: 4 },
    { id: 'publicity', name: 'Publicity', icon: 'PR', order: 5 },
    { id: 'multimedia', name: 'Multimedia', icon: 'MM', order: 6 }
  ];


  function fromRow(row) {
    return {
      id: row.id,
      group: row.group_name,
      department: row.department || '',
      position: row.position,
      name: row.name || '',
      photo: row.photo || '',
      order: row.display_order,
      published: row.published !== false,
      fixed: Boolean(row.fixed),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  function toRow(member) {
    return {
      id: member.id,
      group_name: member.group,
      department: member.department || '',
      position: member.position,
      name: member.name || '',
      photo: member.photo || '',
      display_order: Number(member.order) || 999,
      published: member.published !== false,
      fixed: Boolean(member.fixed),
      updated_at: new Date().toISOString()
    };
  }

  async function ensureSeedData() {}

  async function getAllMembers() {
    const { data, error } = await IEMSupabase.from('committee_members').select('*');
    if (error) throw error;
    return sortMembers((data || []).map(fromRow));
  }

  async function saveMember(member) {
    const record = { ...member };
    if (record.photo?.startsWith('data:')) {
      record.photo = await IEMCloud.uploadDataUrl(record.photo, 'committee', record.id || 'member');
    }
    const { data, error } = await IEMSupabase.from('committee_members').upsert(toRow(record)).select().single();
    if (error) throw error;
    return fromRow(data);
  }

  async function deleteMember(id) {
    const { error } = await IEMSupabase.from('committee_members').delete().eq('id', id);
    if (error) throw error;
  }

  function makeId(prefix = 'committee') {
    if (crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function sortMembers(members) {
    return [...members].sort((a, b) => {
      const aGroup = a.group === 'management' ? 0 : 1;
      const bGroup = b.group === 'management' ? 0 : 1;
      if (aGroup !== bGroup) return aGroup - bGroup;
      if (a.group === 'department' && b.group === 'department') {
        const aDept = departments.find(item => item.id === a.department)?.order || 999;
        const bDept = departments.find(item => item.id === b.department)?.order || 999;
        if (aDept !== bDept) return aDept - bDept;
      }
      return (Number(a.order) || 999) - (Number(b.order) || 999);
    });
  }

  function departmentInfo(id) {
    return departments.find(item => item.id === id) || null;
  }

  async function resetToDefault() {
    throw new Error('Cloud mode is active. Edit positions individually instead of resetting browser data.');
  }

  window.IEMCommitteeStore = { departments, ensureSeedData, getAllMembers, saveMember, deleteMember, makeId, sortMembers, departmentInfo, resetToDefault, cloud: true };
})();
