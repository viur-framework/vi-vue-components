export default {
  actions: {
    add: "Add",
    addnode: "Add node",
    clone: "Clone",
    delete: {
      text: "Delete",
      msg: "`Do you want to delete these {count} entries`"
    },
    debug: "Debug",
    edit: "Edit",
    overlay: "Overlay",
    preview: "Preview",
    reload: "Reload",
    selectfields: "Fields",
    setamount: "Amount",
    save: "Save",
    save_close: "Save and close",
    filter: {
      text: "Filter",
      nofilter: "There are no filter for this module"
    },
    nextpage: "More Entries ({amount})",
    nextpage_finish: "Entries: {amount}",
    fluidpage: {
      edit: "Edit Contents",
      emptyheadline: "This Fluidpage is empty",
      emptytext: 'Please use the "Add"-Button to add content to this page.'
    },
    reset: "Reset",
    open: "Open",
    sortasc: "Sort Ascending",
    sortdesc: "Sort Descending",
    translate:"Translate"
  },
  sidebar: {
    workspace: "Workspace",
    administration: "Administration",
    favorites: "Favorites",
    name: "User Configuration",
    logout: "Ausloggen",
    section_general_name: "General",
    section_general_configuration: "Configuration",
    section_general_cache: "clear cache",
    section_system_name: "System Jobs",
    section_system_searchindex: "Rebuild Search Index",
    section_system_vacuum: "Vacuum Viur Relations",
    section_system_entities: "Clear all entities of a kind",
    section_tools: "Tools"
  },
  skeldrawer: {
    noentry: "No entry selected"
  },
  selectfields: {
    selectall: "Select all",
    unselectall: "Unselect all",
    invertselect: "Invert selection"
  },
  relation: {
    select: "Select",
    abort: "Cancel"
  },
  tab: {
    amount_warning: "You have already opened {amount} entries of '{module}'. Do you still want to open another one?"
  },
  abort: "Abort",
  confirm: "Confirm",
  create: "Create",
  select: "Select",
  refresh: "Refresh",
  search: {
    local: "Search in list",
    database: "Search Online"
  },
  login: {
    email: "Email",
    password: "Password",
    login: "Login",
    logout: "Logout",
    with_google: "Login with Google",
    or: "or"
  },
  noaccess: {
    title: "No access",
    descr: "This user does not have enough permissions."
  },
  connection:{
    header:'Connection not found.',
    message:'No connection to the ViUR Core could be established.'
  }
}
