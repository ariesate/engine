import {
  createElement,
  createComponent,
  reactive,
  ref,
  refComputed,
  computed,
} from "axii";
import Editor from "./Editor";
import Todos from "./Todos";
import Filter from "./Filter";

let uid = 0;
const generateId = () => uid++;
const FILTER_ALL = 0;
const FILTER_ACTIVE = 1;
const FILTER_COMPLETED = 2;

const App = () => {
  const text = ref("");
  const handleTextChange = (value) => {
    text.value = value;
  };
  const handleTextSubmit = (value) => {
    text.value = "";
    todos.push({
      id: generateId(),
      text: value,
      status: "uncompleted",
    });
  };

  const todos = reactive([]);
  const handleTodoChange = (index, newItem) => {
    Object.assign(todos[index], newItem);
  };

  const filter = ref(FILTER_ALL);
  const options = [
    {
      label: "All",
      value: FILTER_ALL,
    },
    {
      label: "Active",
      value: FILTER_ACTIVE,
    },
    {
      label: "Completed",
      value: FILTER_COMPLETED,
    },
  ];
  const filteredTodos = computed(() => {
    if (filter.value === FILTER_ALL) {
      return todos;
    } else {
      const statusMap = {
        [FILTER_ACTIVE]: "uncompleted",
        [FILTER_COMPLETED]: "completed",
      };
      return todos.filter((item) => item.status === statusMap[filter.value]);
    }
  });
  const handleFilterChange = (currentFilter) => {
    filter.value = currentFilter;
    console.log(filter);
  };

  const handleClearCompleted = () => {
    const temp = todos.slice();
    temp.forEach((item) => {
      if (item.status === "completed") {
        const index = todos.indexOf(item);
        if (index > 0) {
          todos.splice(index, 1);
        }
      }
    });
  };

  const todoCount = refComputed(
    () => todos.filter((item) => item.status === "uncompleted").length
  );
  const todoCountDesc = refComputed(() =>
    todoCount.value > 1 ? "items" : "item"
  );

  return (
    <div>
      <h1>TODO MVC</h1>
      <Editor
        value={text}
        onChange={handleTextChange}
        onSubmit={handleTextSubmit}
      />
      <Todos todos={filteredTodos} onChange={handleTodoChange} />
      <footer>
        <counter>
          {todoCount} {todoCountDesc} left
        </counter>
        <Filter
          value={filter}
          options={options}
          onChange={handleFilterChange}
        />
        <clear onClick={handleClearCompleted}>Clear completed</clear>
      </footer>
    </div>
  );
};

App.Style = (fragments) => {
  fragments.root.elements.div.style({
    width: "500px",
    margin: "20px auto 0",
  });
  fragments.root.elements.h1.style({
    textAlign: "center",
  });
  fragments.root.elements.footer.style({
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8,
  });
};

export default createComponent(App);
