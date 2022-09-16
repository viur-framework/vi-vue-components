import { mount } from '@vue/test-utils'
import add from "../../src/components/Actions/add.vue"

test("mount component", async()=>{
    expect(add).toBeTruthy()

    const add_inst = mount(add)

    //expect(add_inst.html()).toMatchSnapshot()
    await add_inst.get("sl-button").trigger("click")
})